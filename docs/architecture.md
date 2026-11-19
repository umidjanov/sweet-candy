# SweetMarket — System Architecture Document

## 1. Executive Overview

**SweetMarket** is a production-grade multi-vendor marketplace tailored specifically for confectioners, home bakers, artisanal sweet makers, and dessert shops. The platform bridges individual pastry chefs and sweet lovers through an intuitive browsing catalog, real-time seller Telegram dispatch notifications, custom order requests, seller-isolated order routing, verified buyer reviews, and an administrative moderation panel.

---

## 2. Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT CLIENTS                                    |
|   +------------------------------------+   +----------------------------------+   |
|   |         Next.js 14+ Web App        |   |      Mobile / Responsive Web     |   |
|   |  - App Router, Tailwind, Lucide    |   |  - Framer Motion, shadcn/ui      |   |
|   |  - React Hook Form + Zod           |   |  - TanStack Query v5             |   |
|   +-----------------+------------------+   +-----------------+----------------+   |
+---------------------|----------------------------------------|--------------------+
                      | HTTPS / REST (JSON)                    |
                      v                                        v
+-----------------------------------------------------------------------------------+
|                               SWEETMARKET API GATEWAY                             |
|                           Node.js + Express.js (v1 API)                           |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Middleware Pipeline:                                                        |  |
|  | - Helmet Security Headers, CORS Policy                                      |  |
|  | - Rate Limiter (Memory / Redis-backed)                                      |  |
|  | - JWT Authentication & Refresh Token Rotation Verification                  |  |
|  | - Strict RBAC (CUSTOMER, SELLER, ADMIN)                                     |  |
|  | - Zod Payload Validation Middleware                                         |  |
|  | - Centralized Error Handler & Audit Logging                                 |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Application Modules & Controllers:                                          |  |
|  | - Auth Module (Customer/Seller reg, login, refresh, admin bootstrap)        |  |
|  | - Product & Catalog Module (Search, fulltext, filters, allergens, photos)   |  |
|  | - Cart & Checkout (Vendor segregation, price snapshotting, DB transaction)  |  |
|  | - Order Lifecycle Module (State machine: Pending -> Accepted -> Ready etc.)|  |
|  | - Seller Management & Analytics (Orders, earnings, products)                |  |
|  | - Telegram Bot Dispatcher (Deep linking, one-time token handshake, retries) |  |
|  | - Reviews & Ratings (Verified purchase gate)                                |  |
|  | - Admin Moderation & Audit Engine                                           |  |
|  +-----------------------------------------------------------------------------+  |
+--------------------------+-------------------------------+------------------------+
                           |                               |
                           v                               v
+------------------------------------+     +----------------------------------------+
|          DATABASE TIER             |     |           EXTERNAL SERVICES            |
|                                    |     |                                        |
|  PostgreSQL 15+ (Relational DB)    |     |  Telegram Bot API:                     |
|  - Managed via Prisma ORM          |     |  - Direct HTTP notifications to seller |
|  - ACID Transactions               |     |  - Deep-link auth handshake (/start)   |
|  - Decimal(12,2) for Money (UZS)   |     |                                        |
|  - Indexing: phone, category,      |     |  Local / Cloud File Storage:           |
|    seller_id, status, timestamps   |     |  - Multer upload + sanitized paths     |
+------------------------------------+     +----------------------------------------+
```

---

## 3. Technology Stack & Decision Rationale

| Layer | Selected Tech | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14+ (App Router), React, TypeScript | Server and Client components, SEO optimization for public bakery pages, high responsiveness. |
| **Styling & Design System**| Tailwind CSS, Lucide React, Framer Motion | Rapid custom styling using the SweetMarket pink-and-cream design tokens, smooth micro-interactions. |
| **State & Data Fetching** | TanStack Query v5, React Hook Form, Zod | Optimistic UI updates, automated caching/invalidation, and end-to-end schema validation. |
| **Analytics & Charts** | Recharts | Composable declarative SVG charts for seller and admin dashboards. |
| **Backend Runtime** | Node.js (v20+ LTS) + Express.js + TypeScript | High throughput, asynchronous I/O, clean separation of routes, controllers, and services. |
| **Database & ORM** | PostgreSQL + Prisma ORM | Relational integrity, foreign keys, ACID multi-vendor checkout transactions, robust schema migrations. |
| **Authentication** | JWT (Short-lived Access + Refresh Tokens with rotation), bcrypt | Stateless high performance with secure revocation in PostgreSQL. |
| **Bot Notification** | Official Telegram Bot API | Instant notification directly to sellers' mobile phones upon new orders. |

---

## 4. Multi-Tenant & Vendor Isolation Boundaries

1. **Catalog Browsing**: Public. Anyone can view approved sellers' active products.
2. **Product Mutation**: Strict ownership verification (`product.seller_id === authenticatedUser.sellerProfile.id`). Non-owners receive HTTP 403 Forbidden.
3. **Multi-Vendor Cart Splitting**:
   - When a customer checks out a cart containing items from multiple sellers (e.g., Seller A's Macarons and Seller B's Birthday Cake), the backend executes a database transaction that splits the checkout into distinct seller-specific orders.
   - Seller A receives only Order A (with Seller A's items and subtotal). Seller A's Telegram bot notification contains solely their items.
   - Seller B receives only Order B.
   - The customer sees both orders linked in their `/account/orders` page.
4. **Order State Updates**: Only the assigned seller (or an admin) can transition an order from `PENDING` to `ACCEPTED`, `PREPARING`, `READY`, etc.

---

## 5. Security & Authentication Architecture

1. **Passwords**: Hashed with `bcrypt` (12 salt rounds). Never returned in any API response or log.
2. **Tokens**:
   - Access Token: 15-minute lifespan, signed with `JWT_ACCESS_SECRET`. Contains `userId`, `role`, and `sellerId` (if applicable).
   - Refresh Token: 7-day lifespan, stored hashed in `refresh_tokens` table. Sent via secure HttpOnly cookie or bearer refresh request with immediate token rotation.
3. **Role-Based Access Control (RBAC)**:
   - Middleware: `requireAuth`, `requireRole('CUSTOMER' | 'SELLER' | 'ADMIN')`.
   - Never trusts role claims from the client. Role is resolved from token signature and verified against the database.
4. **Admin Bootstrap Pattern**:
   - On server startup, the backend checks if an admin with `ADMIN_EMAIL` (`fayzullohumidjanov@gmail.com`) exists.
   - If not found, it provisions the initial administrator using `ADMIN_INITIAL_PASSWORD` (hashed via bcrypt), setting `must_change_password = true`.
   - Admin initial password is never hardcoded and never logged.
5. **Input Validation**: All query params, route parameters, and request bodies are strictly validated through Zod schemas before reaching business controllers.

---

## 6. Telegram Bot Integration Handshake

```
+--------------------+        +---------------------+        +--------------------+
|  Seller Dashboard  |        |  SweetMarket Server |        | Telegram Platform  |
+---------+----------+        +----------+----------+        +---------+----------+
          |                              |                             |
          | 1. Click "Connect Telegram"  |                             |
          |----------------------------->|                             |
          |                              | 2. Generate cryptographically|
          |                              |    random token (15m expiry)|
          | 3. Returns deep-link URL     |<----------------------------|
          |    t.me/Bot?start=TOKEN      |                             |
          |<-----------------------------|                             |
          |                                                            |
          | 4. Seller opens bot link and presses "Start"              |
          +----------------------------------------------------------->|
                                                                       | 5. Bot sends webhook
                                         |                             |    or poll: /start TOKEN
                                         |<----------------------------+
                                         |
                                         | 6. Verify token & update seller_profiles
                                         |    telegram_chat_id = chat_id
                                         |    telegram_connected = true
                                         |
                                         | 7. Send confirmation message to Seller
                                         +---------------------------->|
```

---

## 7. UI/UX Design System Tokens

```css
:root {
  --primary-pink: #E85D8E;
  --dark-pink: #C83F72;
  --light-pink: #FFF0F5;
  --cream: #FFF8EF;
  --background: #FAF8F6;
  --white: #FFFFFF;
  --text-main: #29252A;
  --text-secondary: #817781;
  --border: #EEE6E9;
  --chocolate: #70452F;
  --caramel: #D99A52;
  --success: #269B69;
  --warning: #E7A23B;
  --error: #DC5151;
}
```
All UI elements incorporate rounded corners (`rounded-2xl`, `rounded-xl`), smooth drop shadows (`shadow-sm`, `shadow-md`), and friendly dessert-focused typography and imagery.

