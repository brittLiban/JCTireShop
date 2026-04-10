#!/usr/bin/env bash
# =============================================================================
# deploy.sh — JC Tire Shop deployment script
# =============================================================================
# First deploy (run once on a fresh clone):
#   git clone <repo> /root/jctireshop
#   bash /root/jctireshop/scripts/deploy.sh
#
# Re-deploy after pushing code changes:
#   cd /root/jctireshop && git pull && bash scripts/deploy.sh
#
# Assumes the central nginx proxy is already running at /root/proxy
# and proxy-net Docker network already exists.
# =============================================================================
set -euo pipefail

# ── colours & helpers ─────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
log()  { echo -e "  ${GREEN}✓${NC}  $1"; }
info() { echo -e "  ${BLUE}→${NC}  $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
die()  { echo -e "\n  ${RED}✗  ERROR: $1${NC}\n" >&2; exit 1; }
step() { echo -e "\n${BOLD}${BLUE}── $1${NC}"; }

# ── constants ─────────────────────────────────────────────────────────────────
PROXY_DIR=/root/proxy
JCTIRE_DIR=/root/jctireshop
DOMAIN=jctiresshop.com

# ── root check ────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && die "Run as root (sudo -i or from root shell)"

# ── banner ────────────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}"
cat <<'BANNER'
 ╔══════════════════════════════════════════════════════╗
 ║         JC Tire Shop — Deployment Script            ║
 ║       nginx multi-site proxy + Next.js app          ║
 ╚══════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

# ── detect first vs re-deploy ─────────────────────────────────────────────────
IS_FIRST_DEPLOY=true
if docker compose -f "$JCTIRE_DIR/docker-compose.prod.yml" ps 2>/dev/null | grep -q "running\|Up"; then
    IS_FIRST_DEPLOY=false
    echo -e "  ${DIM}Mode: re-deploy (app already running)${NC}\n"
else
    echo -e "  ${DIM}Mode: first deploy${NC}\n"
fi

# ── prerequisites ─────────────────────────────────────────────────────────────
step "Checking prerequisites"

command -v docker >/dev/null 2>&1     || die "Docker not found"
docker compose version >/dev/null 2>&1 || die "Docker Compose plugin not found"
command -v git >/dev/null 2>&1         || die "git not found"

[[ -d "$JCTIRE_DIR/.git" ]] || die "No git repo at $JCTIRE_DIR — clone the repo first:\n    git clone <url> $JCTIRE_DIR"
[[ -d "$PROXY_DIR" ]]       || die "Central proxy not found at $PROXY_DIR — set it up first"
[[ -f "$PROXY_DIR/nginx.conf" ]] || die "No nginx.conf found at $PROXY_DIR/nginx.conf"

docker network ls --format '{{.Name}}' | grep -q '^proxy-net$' \
    || die "proxy-net network not found — run: docker network create proxy-net"

# install certbot if missing
if ! command -v certbot >/dev/null 2>&1; then
    info "Installing certbot..."
    apt-get update -qq && apt-get install -y certbot -qq
fi

log "All prerequisites met"

# ── pull latest code ──────────────────────────────────────────────────────────
step "Pulling latest code"
git -C "$JCTIRE_DIR" pull --ff-only
log "Code up to date"

# ── .env setup ────────────────────────────────────────────────────────────────
step "Environment configuration"

if [[ ! -f "$JCTIRE_DIR/.env" ]]; then
    [[ -f "$JCTIRE_DIR/.env.example" ]] || die ".env.example not found"
    cp "$JCTIRE_DIR/.env.example" "$JCTIRE_DIR/.env"

    # Auto-generate a secure NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)
    sed -i "s|REPLACE_WITH_GENERATED_SECRET|$SECRET|" "$JCTIRE_DIR/.env"

    log ".env created with auto-generated credentials"
else
    log ".env already exists — skipping"
fi

# ── DNS check ─────────────────────────────────────────────────────────────────
step "DNS check for $DOMAIN"

SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
RESOLVED_IP=$(getent hosts "$DOMAIN" 2>/dev/null | awk '{print $1}' || echo "")

if [[ -n "$RESOLVED_IP" && "$RESOLVED_IP" == "$SERVER_IP" ]]; then
    log "$DOMAIN → $SERVER_IP ✓"
else
    warn "$DOMAIN resolves to '${RESOLVED_IP:-<not resolving yet>}', this server is $SERVER_IP"
    echo ""
    echo -e "  Set these DNS A records at your registrar:"
    echo -e "  ${BOLD}    $DOMAIN      A  $SERVER_IP${NC}"
    echo -e "  ${BOLD}    www.$DOMAIN  A  $SERVER_IP${NC}"
    echo ""
    read -rp "  DNS not ready yet — continue anyway? SSL cert will fail until DNS propagates. [y/N] " SKIP_DNS
    [[ "${SKIP_DNS,,}" == "y" ]] || die "Set DNS first, then re-run the script"
fi

# ── SSL certificate ───────────────────────────────────────────────────────────
step "SSL certificate for $DOMAIN"

CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [[ -f "$CERT_PATH" ]]; then
    log "Certificate already exists — skipping issuance"
else
    info "Issuing SSL certificate via webroot..."
    mkdir -p /var/www/certbot

    certbot certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --register-unsafely-without-email \
        || {
            warn "Webroot method failed — trying standalone (will briefly use port 80)"
            docker compose -f "$PROXY_DIR/docker-compose.yml" stop nginx
            certbot certonly \
                --standalone \
                -d "$DOMAIN" \
                -d "www.$DOMAIN" \
                --non-interactive \
                --agree-tos \
                --register-unsafely-without-email
            docker compose -f "$PROXY_DIR/docker-compose.yml" start nginx
        }

    log "SSL certificate issued"
fi

# ── Add jctireshop to proxy nginx.conf ────────────────────────────────────────
step "Updating proxy nginx config"

if grep -q "$DOMAIN" "$PROXY_DIR/nginx.conf"; then
    log "jctireshop already in proxy config — skipping"
else
    info "Adding $DOMAIN server block to proxy nginx.conf..."

    # Append jctireshop server block before the closing brace of http {}
    # We insert it at the end of the file (before last })
    JCTIRE_BLOCK="
  # jctiresshop.com
  server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    location / {
      proxy_pass http://jctireshop-nginx-1:80;
      proxy_http_version 1.1;
      proxy_set_header Upgrade \$http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host \$host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto https;
      proxy_read_timeout 60s;
    }
  }
"

    # Insert block before the last closing brace
    head -n -1 "$PROXY_DIR/nginx.conf" > /tmp/nginx_tmp.conf
    echo "$JCTIRE_BLOCK" >> /tmp/nginx_tmp.conf
    echo "}" >> /tmp/nginx_tmp.conf
    mv /tmp/nginx_tmp.conf "$PROXY_DIR/nginx.conf"

    log "Proxy nginx.conf updated"
fi

# ── Build & start JC Tire Shop ────────────────────────────────────────────────
step "Building and starting JC Tire Shop"

info "Building app (first build takes a few minutes)..."
docker compose -f "$JCTIRE_DIR/docker-compose.prod.yml" up -d --build
log "JC Tire Shop containers up"

# ── Reload proxy ──────────────────────────────────────────────────────────────
step "Reloading proxy nginx"

docker compose -f "$PROXY_DIR/docker-compose.yml" exec nginx nginx -s reload 2>/dev/null \
    || docker compose -f "$PROXY_DIR/docker-compose.yml" restart nginx

log "Proxy reloaded"

# ── Health checks ─────────────────────────────────────────────────────────────
step "Health checks"

info "Waiting 15s for app to start..."
sleep 15

check_site() {
    local domain=$1 code
    code=$(curl -sk --max-time 10 -o /dev/null -w "%{http_code}" "https://${domain}" 2>/dev/null || echo "000")
    if [[ "$code" =~ ^(200|301|302|307|308)$ ]]; then
        log "https://${domain}  →  HTTP $code ✓"
    else
        warn "https://${domain}  →  HTTP $code  (check logs if this persists)"
    fi
}

check_site "maisonnima.com"
check_site "$DOMAIN"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN} ╔════════════════════════════════════════╗"
echo -e " ║         Deployment complete! 🚀        ║"
echo -e " ╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}https://maisonnima.com${NC}"
echo -e "  ${BOLD}https://$DOMAIN${NC}"
echo ""
echo -e "  ${DIM}Useful commands:${NC}"
echo -e "  ${DIM}  App logs:    docker compose -f $JCTIRE_DIR/docker-compose.prod.yml logs -f app${NC}"
echo -e "  ${DIM}  App shell:   docker compose -f $JCTIRE_DIR/docker-compose.prod.yml exec app sh${NC}"
echo -e "  ${DIM}  Proxy logs:  docker compose -f $PROXY_DIR/docker-compose.yml logs -f${NC}"
echo -e "  ${DIM}  Re-deploy:   cd $JCTIRE_DIR && git pull && bash scripts/deploy.sh${NC}"
echo ""
