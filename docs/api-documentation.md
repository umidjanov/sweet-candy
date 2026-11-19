# SweetMarket — REST API Documentation (v1)

Base URL: `/api/v1`

All responses follow a standardized JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_ERROR",
    "message": "Descriptive message",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register/customer` | Public | Register customer (`first_name`, `last_name`, `phone`, `password`, `confirm_password`) |
| `POST` | `/auth/register/seller` | Public | Register seller (`first_name`, `last_name`, `phone`, `password`, `store_name`, `description`, `address`, `service_area`, `public_phone`) |
| `POST` | `/auth/login` | Public | Login with `phone` and `password`. Returns JWT access token, sets refresh token cookie. |
| `POST` | `/auth/refresh` | Public (Cookie) | Rotates refresh token and returns fresh access token. |
| `POST` | `/auth/logout` | Authenticated | Revokes active refresh token. |
| `GET` | `/auth/me` | Authenticated | Returns currently authenticated user identity and role. |
| `POST` | `/auth/change-password`| Authenticated | Updates password (required for initial admin bootstrap reset). |

---

## 2. Product Catalog & Search (`/api/v1/products`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Public | Search and filter catalog (`q`, `categoryId`, `minPrice`, `maxPrice`, `sellerId`, `rating`, `city`, `sort`, `page`, `limit`) |
| `GET` | `/products/featured` | Public | Retrieve top-rated and trending dessert highlights |
| `GET` | `/products/:id` | Public | Get full product detail (ingredients, allergens, prep time, photos, seller contact) |
| `POST` | `/products` | Seller | Create a new sweet / dessert listing |
| `PUT` | `/products/:id` | Seller (Owner) | Update an existing listing |
| `DELETE`| `/products/:id` | Seller (Owner) / Admin | Remove or deactivate listing |
| `PATCH` | `/products/:id/status`| Seller (Owner) | Toggle availability (`AVAILABLE`, `UNAVAILABLE`, `OUT_OF_STOCK`) |

---

## 3. Categories (`/api/v1/categories`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Public | List categories with subcategories & product counts |
| `GET` | `/categories/:slug` | Public | Get category details and active listings |
| `POST` | `/categories` | Admin | Create category |
| `PUT` | `/categories/:id` | Admin | Update category name, description, photo |
| `DELETE`| `/categories/:id` | Admin | Delete category (if no active products attached) |

---

## 4. Sellers (`/api/v1/sellers`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/sellers` | Public | List approved bakeries/sellers with city/service area filtering |
| `GET` | `/sellers/:idOrSlug` | Public | Public store profile (description, public phone, address, ratings, active products) |
| `GET` | `/sellers/me/profile` | Seller | Get current seller's store settings |
| `PUT` | `/sellers/me/profile` | Seller | Update store information (phone visibility, address, service area, logo) |
| `GET` | `/sellers/me/analytics`| Seller | Revenue, total orders, pending orders, top products, monthly trend |
| `GET` | `/sellers/me/availability`| Seller | Working hours and open/closed days |
| `PUT` | `/sellers/me/availability`| Seller | Save working hours schedule |

---

## 5. Shopping Cart (`/api/v1/cart`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/cart` | Customer | Get customer's cart grouped by seller with subtotal and delivery checks |
| `POST` | `/cart/items` | Customer | Add product to cart with quantity |
| `PATCH` | `/cart/items/:id` | Customer | Update item quantity |
| `DELETE`| `/cart/items/:id` | Customer | Remove item from cart |
| `DELETE`| `/cart` | Customer | Clear cart |

---

## 6. Orders (`/api/v1/orders`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Customer | Place order (supports single seller or multi-vendor split, date/time, delivery/pickup). Executes ACID transaction and dispatches Telegram notification. |
| `GET` | `/orders/my` | Customer | List customer's orders with current status and history |
| `GET` | `/orders/seller` | Seller | List seller's incoming orders with status filters |
| `GET` | `/orders/:id` | Participant / Admin | Retrieve full order breakdown (items, price snapshots, customer phone, notes) |
| `PATCH` | `/orders/:id/status` | Seller / Admin | Transition status (`ACCEPTED`, `PREPARING`, `READY`, `OUT_OF_DELIVERY`, `COMPLETED`, `REJECTED`) |
| `POST` | `/orders/:id/cancel` | Customer / Seller | Cancel order (permitted only before preparation starts or per policy) |

---

## 7. Telegram Integration (`/api/v1/telegram`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/telegram/connect-token` | Seller | Generates 15-minute one-time token & deep-link (`t.me/<bot>?start=<token>`) |
| `GET` | `/telegram/status` | Seller | Check connection state, connected chat, and test notification dispatch |
| `POST` | `/telegram/disconnect` | Seller | Unlink Telegram account |
| `POST` | `/telegram/webhook` | Telegram Server / Internal | Receives `/start <token>` payload, links `chat_id` to seller profile |
| `GET` | `/telegram/logs` | Seller / Admin | View notification dispatch history & retry statuses |

---

## 8. Reviews & Ratings (`/api/v1/reviews`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reviews/product/:productId` | Public | List reviews for a specific product |
| `POST` | `/reviews` | Customer | Submit review for completed order item (validates verified purchase) |
| `DELETE`| `/reviews/:id` | Admin | Moderate / hide inappropriate review |

---

## 9. Favorites (`/api/v1/favorites`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/favorites` | Customer | List saved sweets |
| `POST` | `/favorites/:productId` | Customer | Toggle favorite status |

---

## 10. Custom Orders (`/api/v1/custom-orders`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/custom-orders` | Customer | Submit custom cake/dessert request to a seller |
| `GET` | `/custom-orders/my` | Customer | View status of custom requests |
| `GET` | `/custom-orders/seller` | Seller | Review incoming custom dessert requests |
| `PATCH` | `/custom-orders/:id` | Seller | Accept, provide quotation, or decline |

---

## 11. In-App Notifications (`/api/v1/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Authenticated | List user notifications with unread count |
| `PATCH` | `/notifications/:id/read` | Authenticated | Mark notification as read |
| `PATCH` | `/notifications/read-all` | Authenticated | Mark all notifications as read |

---

## 12. Admin Panel (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/stats` | Admin | Platform overview (total users, sellers, products, orders, revenue, activity) |
| `GET` | `/admin/users` | Admin | List and search all users with role and status filters |
| `PATCH` | `/admin/users/:id/status`| Admin | Suspend or reactivate user |
| `GET` | `/admin/sellers` | Admin | List sellers by status (`PENDING`, `APPROVED`, `SUSPENDED`) |
| `PATCH` | `/admin/sellers/:id/approval`| Admin | Approve, reject, or suspend seller store |
| `GET` | `/admin/orders` | Admin | Monitor all platform orders across sellers and customers |
| `GET` | `/admin/audit-logs` | Admin | Immutable system audit log trail |
| `GET` | `/admin/reports` | Admin | View user reports regarding products or stores |
| `PATCH` | `/admin/reports/:id` | Admin | Resolve or dismiss report |

