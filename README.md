# JC Tire Shop

Full-stack web app for JC Tire Shop — public-facing site + admin dashboard, fully containerized with Docker.

## Stack
- **Next.js 14** (App Router, TypeScript, Tailwind CSS, Framer Motion)
- **PostgreSQL + Prisma** (inventory, orders, contact submissions)
- **NextAuth.js** (admin login)
- **Nodemailer** (email notifications)
- **Calendly** embed (appointment booking)
- **Google Places API** (live testimonials)
- **Docker Compose + Nginx + Certbot** (production SSL)

---

## Quick Start (Development)

```bash
# 1. Clone and enter the project
git clone <repo-url> && cd JCTireShop

# 2. Set up environment
cp .env.example .env
# Edit .env with your values (see sections below)

# 3. Generate admin password hash
node -e "const b=require('bcryptjs'); b.hash('yourpassword',10).then(console.log)"
# Paste the output as ADMIN_PASSWORD_HASH in .env

# 4. Start the stack
docker compose up --build

# 5. Visit http://localhost
```

---

## Production Deployment (VM with SSL)

### Prerequisites
- A VM (Ubuntu 22.04 recommended) with Docker + Docker Compose installed
- Domain pointed at your VM's IP (A record: `jctireshop.com` → VM IP)

```bash
# 1. Clone repo on VM
git clone <repo-url> && cd JCTireShop

# 2. Set up environment
cp .env.example .env
# Edit .env — set NEXTAUTH_URL=https://jctireshop.com

# 3. Get SSL certificate (first time only)
chmod +x scripts/init-ssl.sh
./scripts/init-ssl.sh jctireshop.com your@email.com

# 4. Start production stack
docker compose -f docker-compose.prod.yml up -d

# 5. Visit https://jctireshop.com ✓
```

SSL certificates auto-renew every 12 hours via the certbot container.

---

## Environment Variables

### Required
| Variable | Description |
|---|---|
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password (make it strong) |
| `POSTGRES_DB` | Database name |
| `DATABASE_URL` | Full connection string (update user/password to match above) |
| `NEXTAUTH_SECRET` | Random 32+ char string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your full URL (`https://jctireshop.com`) |
| `ADMIN_EMAIL` | Login email for the admin panel |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password (see below) |
| `EMAIL_HOST` | SMTP host (`smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (`587`) |
| `EMAIL_USER` | SMTP username (your Gmail) |
| `EMAIL_PASS` | Gmail App Password (16 chars, no spaces) |
| `EMAIL_TO` | Where contact form emails are sent |

### Optional (but recommended)
| Variable | Description |
|---|---|
| `GOOGLE_PLACES_API_KEY` | Google Places API key (for live reviews) |
| `GOOGLE_PLACE_ID` | Your Google Business Place ID |
| `NEXT_PUBLIC_CALENDLY_URL` | Your Calendly booking page URL |

### Generate Admin Password Hash
```bash
node -e "const b=require('bcryptjs'); b.hash('YourActualPassword',10).then(console.log)"
```

### Get Gmail App Password
1. Go to myaccount.google.com → Security
2. Enable 2-Step Verification
3. Search "App Passwords" → Create one for "Mail"
4. Use the 16-character code (no spaces) as `EMAIL_PASS`

### Get Google Places API Key
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable "Places API"
3. Create an API Key → Restrict to Places API

### Find Your Google Place ID
1. Go to [developers.google.com/maps/documentation/places/web-service/place-id](https://developers.google.com/maps/documentation/places/web-service/place-id)
2. Search for your business name
3. Copy the Place ID (starts with `ChIJ...`)

### Get Your Calendly URL
1. Sign up at [calendly.com](https://calendly.com)
2. Create an event type (e.g., "Tire Appointment")
3. Copy the event URL (e.g., `https://calendly.com/your-name/tire-appointment`)

---

## Admin Panel
- URL: `/admin/login`
- Also accessible via the footer "Staff Login" link
- Dashboard shows: total SKUs, supplier orders, unread messages, low stock alerts
- **Inventory**: Add/edit/delete tire SKUs with brand, model, size, quantity, cost, price
- **Orders**: Track supplier purchase orders with status (Pending → Confirmed → Shipped → Received)

---

## Updating the Site
After changing content (phone number, address, services, etc.):
1. Edit the relevant component file
2. Rebuild: `docker compose up --build -d`

---

## Useful Commands
```bash
# View logs
docker compose logs -f app

# Access database
docker compose exec postgres psql -U jctire -d jctiredb

# Rebuild after code changes
docker compose up --build -d

# Stop everything
docker compose down

# Stop and remove database (careful!)
docker compose down -v
```
