# SweetMarket 🧁 — Multi-Vendor Food & Homemade Sweets Marketplace

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js%2014-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**SweetMarket** is a production-grade, multi-vendor marketplace connecting independent confectioners, home pastry chefs, cake artists, and dessert studios directly with customers. It features real-time seller Telegram order notifications, ACID multi-vendor cart splitting, verified buyer reviews, store availability calendars, and a protected administrator control panel.

---

## 🎨 Visual Identity & Color System

The SweetMarket design system is crafted with pink and cream as the primary visual identity, accented with chocolate and caramel notes:

- **Primary Pink**: `#E85D8E`
- **Dark Pink**: `#C83F72`
- **Light Pink**: `#FFF0F5`
- **Cream**: `#FFF8EF`
- **Background**: `#FAF8F6`
- **White**: `#FFFFFF`
- **Main Text**: `#29252A`
- **Secondary Text**: `#817781`
- **Border**: `#EEE6E9`
- **Chocolate**: `#70452F`
- **Caramel**: `#D99A52`
- **Success**: `#269B69`
- **Warning**: `#E7A23B`
- **Error**: `#DC5151`

---

## 🌟 Core Features

### 🛍️ Customers
- **Public Catalog Browsing**: Explore artisanal cakes, French macarons, cookies, puddings, and regional traditional sweets without mandatory upfront login.
- **Search & Multi-Filtering**: Full-text search across dessert titles, ingredients, and bakery names; filter by category, price range, city, and ratings.
- **Detailed Product Specifications**: Multiple photos, full descriptions, preparation times, portion size, weight, and seller contact.
- **Transparent Allergen Declaration**: View ingredients with declared allergen highlights (nuts, dairy, gluten, eggs).
- **Direct Seller Contact**: One-click click-to-call (`tel:`) to reach the baker directly for custom decoration requests.
- **Multi-Vendor Cart & Checkout**: Automatic seller-order segregation when purchasing from multiple bakeries simultaneously.
- **Scheduled Fulfillment**: Select desired preparation date, delivery or self-pickup time, and cake greeting inscriptions.
- **Order Tracking (`/account/orders`)**: Real-time status tracking (`Pending` -> `Accepted` -> `Preparing` -> `Ready` -> `Completed`).
- **Verified Buyer Reviews**: Rate and review desserts only after an order is marked completed.
- **Wishlist**: Save favorite sweets for later.

### 👩‍🍳 Sellers (Confectioners)
- **Storefront Management**: Store profile, custom description, kitchen address, service delivery area, and public phone toggle.
- **Dessert Catalog CRUD**: Add and edit sweets with multiple photos, preparation hours, portion sizes, prices, and allergen tags.
- **Order Management Workflow**: Review incoming orders with customer contacts; Accept, Decline, Start Baking, Mark Ready, and Complete.
- **Instant Telegram Bot Alerts**: Official Telegram Bot API integration delivering instant notifications with customer notes to the seller's phone.
- **Sales Analytics**: Live revenue charts (Recharts), pending vs. completed order volumes, and top-performing desserts.
- **Working Hours Schedule**: Set open and closed days and working hours.

### 🛡️ Administrators
- **Platform Overview**: Real-time metrics on gross sales, user counts, active listings, order statuses, and recent registrations.
- **Seller Verification**: Review confectioner applications and approve, reject, or suspend seller stores.
- **User Management**: Search user directory, filter by role (`CUSTOMER`, `SELLER`, `ADMIN`), and suspend/reactivate accounts.
- **Product Moderation**: Hide inappropriate listings from public catalog search or permanently remove them.
- **Category Manager**: Add, edit, and organize taxonomy (Cakes, Sweets, Desserts, Traditional Sweets).
- **Immutable Audit Trail**: Compliance ledger recording all moderation actions.
- **Admin Bootstrap**: Initial administrator bootstrapped securely with `ADMIN_EMAIL` (`fayzullohumidjanov@gmail.com`) requiring password change on first login.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Recharts |
| **Backend API**| Node.js, Express.js (v1 REST API), TypeScript, Zod, Multer, Helmet, CORS |
| **Database** | PostgreSQL 15+, Prisma ORM (ACID transactions, Decimal monetary precision) |
| **Auth** | JWT (Access Tokens + Refresh Token rotation in PostgreSQL), bcrypt |
| **Bot Integration** | Official Telegram Bot API (Deep-link `/start <token>` one-time handshake) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+ LTS
- **Docker & Docker Compose** (for PostgreSQL) or local PostgreSQL instance
- **npm** (v10+)

### 2. Configuration

Copy environment configuration:
```bash
cp .env.example .env
```

Review `.env`:
```env
DATABASE_URL=postgresql://sweetmarket:sweetmarket_pass@localhost:5432/sweetmarket_db?schema=public
PORT=4000
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_ACCESS_SECRET=your_jwt_access_secret_min32chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min32chars
ADMIN_EMAIL=fayzullohumidjanov@gmail.com
ADMIN_INITIAL_PASSWORD=AdminSecurePassword2026!
TELEGRAM_BOT_TOKEN=
```

### 3. Start Database & Run Migrations

Start PostgreSQL via Docker Compose:
```bash
docker compose up -d
```

Run database schema push and taxonomy seed:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

> **Clean Database Guarantee**: Per project specifications, the database initializes with **zero fake customers, zero fake sellers, and zero fake orders**. Only the initial Administrator account (`ADMIN_EMAIL`) is securely bootstrapped.

### 4. Run Development Servers

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api/v1`
- **Health Check**: `http://localhost:4000/health`

### 5. Automated Tests

Run the test suite:
```bash
npm test
```

---

## 📱 Telegram Bot Setup for Sellers

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Create a new bot with `/newbot` and obtain your HTTP API Token.
3. Add token to `.env` as `TELEGRAM_BOT_TOKEN`.
4. In the **Seller Dashboard -> Telegram Alerts**, click **Connect Telegram**.
5. The system generates a 15-minute one-time cryptographic token and opens `https://t.me/<YourBot>?start=<TOKEN>`.
6. Pressing **Start** securely binds the seller's Telegram Chat ID.
7. When an order is placed, full order information is dispatched immediately to the seller's phone.

---

## 📂 Project Architecture

```
sweetmarket/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/             # Database & environment validation
│   │   │   ├── controllers/        # Express route controllers
│   │   │   ├── integrations/       # Telegram Bot API service
│   │   │   ├── middleware/         # Auth, RBAC, Validation, Multer, Error handler
│   │   │   ├── routes/             # Modular REST API endpoints (/api/v1)
│   │   │   ├── services/           # Business domain logic & ACID transactions
│   │   │   ├── utils/              # JWT, bcrypt hashing, order numbers, responses
│   │   │   └── validators/         # Zod schemas for requests
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Relational PostgreSQL schema (22 tables)
│   │   │   └── seed.ts             # Initial taxonomy seed
│   │   └── tests/                  # Unit and integration test suite
│   └── web/
│       ├── app/                    # Next.js 14 App Router routes
│       │   ├── (public)            # Landing (/), /explore, /categories, /sellers
│       │   ├── account/            # /account/orders, /account/favorites, /account/profile
│       │   ├── seller/             # Seller dashboard, products CRUD, orders, analytics
│       │   ├── admin/              # Admin dashboard, users, sellers, products, logs
│       │   ├── cart/ & checkout/   # Shopping cart and multi-vendor checkout
│       │   └── login/ & register/  # Authentication flows
│       ├── components/             # Reusable UI & Layout components
│       └── lib/                    # AuthContext, CartContext, API client, utilities
├── docs/                           # Architecture, Database Schema, API Docs, Setup Guide
├── docker-compose.yml              # PostgreSQL container configuration
├── .env.example                    # Environment variable template
└── README.md
```

---

## 🛡️ Security Best Practices

- **Zero Plain-Text Credentials**: Passwords hashed with `bcrypt` (12 rounds).
- **Server-Side Authorization**: Roles are never trusted from the client and verified against DB tokens.
- **ACID Transaction Isolation**: Multi-vendor checkout processes snapshot item prices into historical order records.
- **Telegram Resilience**: Telegram API dispatch runs non-blocking so temporary network interruptions cannot drop database orders.
- **Audit Logging**: All administrative status modifications are persisted in `audit_logs`.

