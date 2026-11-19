# SweetMarket — Setup & Deployment Guide

This guide walks through configuring and running the **SweetMarket** platform locally and in production.

---

## 1. Prerequisites

- **Node.js**: v20.x or v22.x LTS
- **npm** (v10+) or **pnpm** / **yarn**
- **PostgreSQL**: v15+ (Local installation or via Docker Compose)
- **Telegram Account**: For creating and connecting the seller notification bot via [@BotFather](https://t.me/BotFather)

---

## 2. Quick Start (Development)

### Step 1: Clone and Configure Environment

```bash
cp .env.example .env
```

Review `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string.
- `ADMIN_EMAIL`: Must be `fayzullohumidjanov@gmail.com`.
- `ADMIN_INITIAL_PASSWORD`: Secure initial password for admin bootstrap.
- `TELEGRAM_BOT_TOKEN`: Token obtained from @BotFather (optional for local dry-run).

### Step 2: Start PostgreSQL Database

Using Docker Compose:
```bash
docker compose up -d
```
Verify the container is healthy:
```bash
docker compose ps
```

### Step 3: Install Dependencies & Run Database Migrations

From root:
```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed script will populate:
- Product Categories (Cakes, Sweets, Desserts, Traditional Sweets, etc.)
- Platform settings

**Note on initial users**:
As specified in the system requirements, the database initializes with **no registered customers, no registered sellers, and no fake orders**. Only the initial Administrator account (`ADMIN_EMAIL`) is bootstrapped securely if not already present.

### Step 4: Start Backend API and Frontend Web Client

In development mode:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api/v1`
- **API Documentation**: `http://localhost:4000/api-docs`

---

## 3. Telegram Bot Setup for Sellers

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Create a new bot with `/newbot`, name it (e.g., `SweetMarket Notification Bot`), and assign a username ending in `bot`.
3. Copy the HTTP API token into `.env` as `TELEGRAM_BOT_TOKEN`.
4. Sellers navigate to **Seller Dashboard -> Telegram Settings** and click **Connect Telegram**.
5. The platform generates a one-time connection token and opens `https://t.me/<YourBotUsername>?start=<TOKEN>`.
6. Clicking Start links the seller's `chat_id` securely to their store profile. When an order is placed, order notifications are sent immediately to their Telegram.

---

## 4. Production Deployment Checklist

- [ ] Change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to random 256-bit cryptographic keys.
- [ ] Ensure `ADMIN_INITIAL_PASSWORD` is securely set; log in and immediately complete mandatory password change.
- [ ] Set `NODE_ENV=production`.
- [ ] Configure SSL/TLS certificates and reverse proxy (Nginx or Cloudflare).
- [ ] Run automated test suite: `npm test`.

