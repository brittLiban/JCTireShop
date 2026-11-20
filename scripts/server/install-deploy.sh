#!/usr/bin/env bash
# One-time server setup for CI deploys. Run as root:
#   sudo bash install-deploy.sh /path/to/ci_deploy_key.pub
# Creates user `deploy` (no password, no shell access for the key), installs the
# two scripts and a sudoers rule that allows exactly one command. Does NOT touch
# containers, the proxy, sshd config, or existing keys.
set -euo pipefail
PUB="${1:?path to the CI public key}"
HERE="$(cd "$(dirname "$0")" && pwd)"
[[ $EUID -eq 0 ]] || { echo "run as root"; exit 1; }
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash --comment "CI deploy (forced command)" deploy
passwd -l deploy >/dev/null
install -m 755 -o root -g root "$HERE/jctire-deploy-entry" /usr/local/bin/jctire-deploy-entry
install -m 750 -o root -g root "$HERE/jctire-deploy-root"  /usr/local/bin/jctire-deploy-root
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
printf 'restrict,command="/usr/local/bin/jctire-deploy-entry" %s\n' "$(cat "$PUB")" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys; chmod 600 /home/deploy/.ssh/authorized_keys
tmp=$(mktemp)
echo 'deploy ALL=(root) NOPASSWD: /usr/local/bin/jctire-deploy-root deploy *, /usr/local/bin/jctire-deploy-root rollback' > "$tmp"
visudo -cf "$tmp" >/dev/null
install -m 440 -o root -g root "$tmp" /etc/sudoers.d/91-jctire-deploy; rm -f "$tmp"
touch /var/log/jctire-deploy.log; chmod 640 /var/log/jctire-deploy.log
echo "installed. host key for GitHub secret:  ssh-keyscan -t ed25519 <host>"
