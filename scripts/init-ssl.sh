#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# JC Tire Shop — First-time SSL Certificate Setup
# Run this ONCE on your VM before starting the production stack.
#
# Usage: ./scripts/init-ssl.sh <domain> <email>
# Example: ./scripts/init-ssl.sh jctiresshop.com owner@jctiresshop.com
# ─────────────────────────────────────────────────────────────────────────────

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domain> <email>"
  echo "Example: $0 jctiresshop.com owner@jctiresshop.com"
  exit 1
fi

echo "─────────────────────────────────────────────────"
echo "  JC Tire Shop SSL Setup"
echo "  Domain: $DOMAIN"
echo "  Email:  $EMAIL"
echo "─────────────────────────────────────────────────"

# Create certbot directories
mkdir -p ./certbot/conf ./certbot/www

# Start nginx on port 80 only (before SSL config is active)
# We use a temporary nginx config that only handles port 80
echo "Starting nginx for ACME challenge..."
docker compose -f docker-compose.prod.yml up -d nginx

# Wait for nginx to be ready
sleep 3

# Request the certificate
echo "Requesting Let's Encrypt certificate..."
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

# Reload nginx with the full SSL config
echo "Reloading nginx with SSL..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo ""
echo "✓ SSL certificate obtained successfully!"
echo "✓ Your site is live at https://$DOMAIN"
echo ""
echo "Now start the full production stack:"
echo "  docker compose -f docker-compose.prod.yml up -d"
