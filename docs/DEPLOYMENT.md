# Deployment

```
VS Code → GitHub → CI (typecheck + build) → Deploy to Hetzner → Health check
```

## How it works

| Stage | Where | What happens |
|---|---|---|
| CI | `.github/workflows/ci.yml` | `npm ci`, `prisma generate`, `tsc --noEmit`, `next build` in `app/`. Runs on every pull request and every non-`main` push. |
| Deploy | `.github/workflows/deploy.yml` | Runs on push to `main`. Calls CI first; if CI fails nothing is shipped. Builds the Docker image on the GitHub runner, tags it with the commit SHA, and streams it over SSH to the server. |
| Server | `scripts/server/jctire-deploy-root` | Runs as root via a locked-down `sudo` rule. Loads the image, runs a `pg_dump` (aborts if it fails), swaps **only** the `app` container, reloads the internal nginx, then requires 3 consecutive HTTP 200s from the public site. On failure it automatically swaps back to the previous release. |

Only one deploy runs at a time (GitHub `concurrency` group plus a `flock` on the server).

**Never touched by a deploy:** `.env`, the `pgdata` volume, the postgres container, the internal nginx container, the central proxy in `/root/proxy`, and every other site on the server.

### Security model

- GitHub connects as the dedicated user `deploy` (not root).
- Its SSH key is restricted (`restrict,command=...`) to a forced command that accepts only `deploy <40-hex-sha>` or `rollback`.
- `sudo` allows exactly those two invocations of `jctire-deploy-root`.
- The server's host key is pinned in a secret; `StrictHostKeyChecking yes`.

## GitHub secrets (Settings → Secrets and variables → Actions)

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | `46.224.179.157` |
| `DEPLOY_SSH_KEY_B64` | The CI private key, base64 on one line (548 characters). |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan -t ed25519 46.224.179.157`, verified against the server's real fingerprint. |

One-time server install (already done): `sudo bash scripts/server/install-deploy.sh <ci_key.pub>`.

## Recommended GitHub settings

Settings → Branches → add a rule for `main`: require pull requests and require the **CI / check** status to pass. This makes "failed CI never reaches production" enforced instead of by convention.

## Normal flow

1. Branch, commit, push. CI runs automatically.
2. Open a pull request; wait for green CI.
3. Merge to `main`. CI re-runs, then the deploy job runs.
4. Watch **Actions → Deploy**. Server-side output (image load, db dump, swap, health check) is streamed into the log.

## Rollback

**Automatic:** if the health check fails after a swap, the script restores the previous image by itself and the job is marked failed.

**Manual, one click (preferred):** Actions → **Deploy** → **Run workflow** → tick **rollback** → Run. This swaps back to the previous release and verifies health.

**Manual, from a shell:**

```bash
ssh deploy@46.224.179.157 rollback      # needs the CI key
```

Only the last two releases are tracked as current/previous, so rolling back twice swaps between them. To go further back, revert the commit in git and push; that deploys normally.

**Database:** every deploy writes a dump to `/var/backups/jctireshop/pre-<sha>-<timestamp>.sql.gz` (newest 14 kept). The app runs `prisma db push --accept-data-loss` on start, so a schema change that drops data can *not* be undone by an image rollback. Restore the dump if needed:

```bash
sudo -i
gunzip -c /var/backups/jctireshop/pre-<...>.sql.gz | docker exec -i jctireshop-postgres-1 sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

(Test a restore into a scratch database first if there is time.)

## Logs

- GitHub: Actions → Deploy run.
- Server: `/var/log/jctire-deploy.log`.
- Current / previous release: `/var/lib/jctire-deploy/{current,previous}`.

## Health checks

- Public: `https://jctiresshop.com/` must return 200 three times in a row.
- App liveness: `/api/health` (does not touch the database).

## Not covered yet

- No lint step (`next lint` has no ESLint config in this repo) and no automated tests; CI is typecheck + build only.
- The deploy script runs `git pull --ff-only` in `/root/jctireshop` to keep the compose file in sync; the image itself is built from the pushed commit.
