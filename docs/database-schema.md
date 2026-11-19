# SweetMarket — Database Schema Specification

## 1. Relational Database Design Overview

SweetMarket runs on **PostgreSQL** with schema definitions maintained via **Prisma ORM**.
All monetary values (prices, totals, fees) utilize `Decimal(12, 2)` to eliminate floating-point precision errors. Currencies default to `UZS`.

---

## 2. Enums

```prisma
enum UserRole {
  CUSTOMER
  SELLER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

enum SellerApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

enum ProductAvailability {
  AVAILABLE
  UNAVAILABLE
  OUT_OF_STOCK
  PRE_ORDER_ONLY
}

enum OrderStatus {
  PENDING
  ACCEPTED
  PREPARING
  READY
  OUT_OF_DELIVERY
  COMPLETED
  REJECTED
  CANCELLED
}

enum DeliveryType {
  DELIVERY
  PICKUP
}

enum NotificationType {
  ORDER_CREATED
  ORDER_ACCEPTED
  ORDER_REJECTED
  ORDER_PREPARING
  ORDER_READY
  ORDER_COMPLETED
  ORDER_CANCELLED
  NEW_REVIEW
  PRODUCT_MODERATION
  TELEGRAM_STATUS
  SELLER_APPLICATION
  SYSTEM_ALERT
}

enum ReportTargetType {
  PRODUCT
  SELLER
  REVIEW
}

enum ReportStatus {
  PENDING
  RESOLVED
  DISMISSED
}
```

---

## 3. Entity Relationship & Table Definitions

### 3.1 `users`
Core identity table for all platform roles.
- `id`: UUID, Primary Key, default `gen_random_uuid()`
- `first_name`: VARCHAR(100), NOT NULL
- `last_name`: VARCHAR(100), NOT NULL
- `phone`: VARCHAR(30), UNIQUE, NOT NULL (E.164 international format)
- `email`: VARCHAR(255), UNIQUE, NULLABLE (used for initial admin and optional receipts)
- `password_hash`: VARCHAR(255), NOT NULL
- `role`: UserRole, DEFAULT 'CUSTOMER', NOT NULL
- `status`: UserStatus, DEFAULT 'ACTIVE', NOT NULL
- `must_change_password`: BOOLEAN, DEFAULT FALSE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.2 `customer_profiles`
Extended profile for shoppers.
- `id`: UUID, Primary Key
- `user_id`: UUID, UNIQUE, Foreign Key -> `users(id)` ON DELETE CASCADE
- `preferred_address`: TEXT, NULLABLE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.3 `seller_profiles`
Storefront configuration and business identity.
- `id`: UUID, Primary Key
- `user_id`: UUID, UNIQUE, Foreign Key -> `users(id)` ON DELETE CASCADE
- `store_name`: VARCHAR(150), NOT NULL
- `slug`: VARCHAR(160), UNIQUE, NOT NULL
- `description`: TEXT, NOT NULL
- `public_phone`: VARCHAR(30), NULLABLE
- `show_public_phone`: BOOLEAN, DEFAULT TRUE
- `address`: TEXT, NOT NULL
- `city`: VARCHAR(100), NOT NULL DEFAULT 'Tashkent'
- `district`: VARCHAR(100), NULLABLE
- `service_area`: TEXT, NOT NULL
- `logo_url`: TEXT, NULLABLE
- `cover_image_url`: TEXT, NULLABLE
- `approval_status`: SellerApprovalStatus, DEFAULT 'PENDING', NOT NULL
- `telegram_connected`: BOOLEAN, DEFAULT FALSE
- `telegram_chat_id`: BIGINT, NULLABLE
- `rating_average`: DECIMAL(3, 2), DEFAULT 0.00
- `rating_count`: INT, DEFAULT 0
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.4 `seller_availabilities`
Schedule of working hours and ordering limits.
- `id`: UUID, Primary Key
- `seller_id`: UUID, Foreign Key -> `seller_profiles(id)` ON DELETE CASCADE
- `day_of_week`: INT (0 = Sunday ... 6 = Saturday)
- `is_open`: BOOLEAN, DEFAULT TRUE
- `open_time`: VARCHAR(5), DEFAULT '09:00'
- `close_time`: VARCHAR(5), DEFAULT '20:00'
- `daily_order_limit`: INT, NULLABLE

### 3.5 `categories`
Hierarchical sweet and dessert taxonomy.
- `id`: UUID, Primary Key
- `name`: VARCHAR(100), NOT NULL
- `slug`: VARCHAR(120), UNIQUE, NOT NULL
- `description`: TEXT, NULLABLE
- `image_url`: TEXT, NULLABLE
- `parent_id`: UUID, NULLABLE, Foreign Key -> `categories(id)` ON DELETE SET NULL
- `is_active`: BOOLEAN, DEFAULT TRUE
- `display_order`: INT, DEFAULT 0
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.6 `products`
Dessert listings created by approved sellers.
- `id`: UUID, Primary Key
- `seller_id`: UUID, Foreign Key -> `seller_profiles(id)` ON DELETE CASCADE
- `category_id`: UUID, Foreign Key -> `categories(id)` ON DELETE RESTRICT
- `name`: VARCHAR(200), NOT NULL
- `slug`: VARCHAR(220), NOT NULL
- `description`: TEXT, NOT NULL
- `price`: DECIMAL(12, 2), NOT NULL
- `currency`: VARCHAR(10), DEFAULT 'UZS', NOT NULL
- `preparation_time_hours`: INT, NOT NULL DEFAULT 4 (in hours or days)
- `portion_size`: VARCHAR(100), NULLABLE (e.g. "Serves 8-10 people", "6 pieces")
- `weight_grams`: INT, NULLABLE (e.g. 1200)
- `minimum_quantity`: INT, DEFAULT 1, NOT NULL
- `availability_status`: ProductAvailability, DEFAULT 'AVAILABLE'
- `is_hidden_by_admin`: BOOLEAN, DEFAULT FALSE
- `rating_average`: DECIMAL(3, 2), DEFAULT 0.00
- `rating_count`: INT, DEFAULT 0
- `views_count`: INT, DEFAULT 0
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.7 `product_images`
- `id`: UUID, Primary Key
- `product_id`: UUID, Foreign Key -> `products(id)` ON DELETE CASCADE
- `url`: TEXT, NOT NULL
- `is_cover`: BOOLEAN, DEFAULT FALSE
- `display_order`: INT, DEFAULT 0

### 3.8 `product_ingredients` & `product_allergens`
- `id`: UUID, Primary Key
- `product_id`: UUID, Foreign Key -> `products(id)` ON DELETE CASCADE
- `name`: VARCHAR(150), NOT NULL (e.g. "Belgian Dark Chocolate 70%", "Fresh Strawberries")
- `is_allergen`: BOOLEAN, DEFAULT FALSE (e.g. "Nuts", "Gluten", "Dairy", "Eggs")

### 3.9 `carts` & `cart_items`
Persistent multi-vendor client shopping cart.
- `cart`: `id`, `user_id` (Unique, FK -> `users`), `created_at`, `updated_at`
- `cart_item`: `id`, `cart_id` (FK), `product_id` (FK), `quantity` (INT, >= 1)

### 3.10 `orders`
Master order record routed to an individual seller.
- `id`: UUID, Primary Key
- `order_number`: VARCHAR(50), UNIQUE, NOT NULL (e.g. "SM-2611-8934")
- `customer_id`: UUID, Foreign Key -> `users(id)` ON DELETE RESTRICT
- `seller_id`: UUID, Foreign Key -> `seller_profiles(id)` ON DELETE RESTRICT
- `status`: OrderStatus, DEFAULT 'PENDING', NOT NULL
- `subtotal`: DECIMAL(12, 2), NOT NULL
- `delivery_fee`: DECIMAL(12, 2), DEFAULT 0.00, NOT NULL
- `total`: DECIMAL(12, 2), NOT NULL
- `currency`: VARCHAR(10), DEFAULT 'UZS', NOT NULL
- `requested_date`: DATE, NOT NULL
- `requested_time`: VARCHAR(10), NOT NULL (e.g. "14:00 - 16:00")
- `delivery_type`: DeliveryType, NOT NULL
- `delivery_address`: TEXT, NULLABLE
- `customer_name`: VARCHAR(150), NOT NULL
- `customer_phone`: VARCHAR(30), NOT NULL
- `customer_message`: TEXT, NULLABLE
- `seller_notes`: TEXT, NULLABLE
- `rejection_reason`: TEXT, NULLABLE
- `cancellation_reason`: TEXT, NULLABLE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.11 `order_items`
Price-frozen snapshot of items included in an order.
- `id`: UUID, Primary Key
- `order_id`: UUID, Foreign Key -> `orders(id)` ON DELETE CASCADE
- `product_id`: UUID, Foreign Key -> `products(id)` ON DELETE RESTRICT
- `product_name_snapshot`: VARCHAR(200), NOT NULL
- `product_image_snapshot`: TEXT, NULLABLE
- `unit_price_snapshot`: DECIMAL(12, 2), NOT NULL
- `quantity`: INT, NOT NULL
- `line_total`: DECIMAL(12, 2), NOT NULL

### 3.12 `order_status_history`
Audit trail of status transitions.
- `id`: UUID, Primary Key
- `order_id`: UUID, Foreign Key -> `orders(id)` ON DELETE CASCADE
- `from_status`: OrderStatus, NULLABLE
- `to_status`: OrderStatus, NOT NULL
- `changed_by_user_id`: UUID, Foreign Key -> `users(id)`
- `note`: TEXT, NULLABLE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.13 `telegram_connections`
One-time cryptographically secure handshake tokens for linking Telegram bots.
- `id`: UUID, Primary Key
- `seller_id`: UUID, Foreign Key -> `seller_profiles(id)` ON DELETE CASCADE
- `token`: VARCHAR(128), UNIQUE, NOT NULL
- `expires_at`: TIMESTAMP WITH TIME ZONE, NOT NULL
- `is_used`: BOOLEAN, DEFAULT FALSE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.14 `telegram_notifications`
Delivery log and retry ledger.
- `id`: UUID, Primary Key
- `order_id`: UUID, Foreign Key -> `orders(id)` ON DELETE CASCADE
- `seller_id`: UUID, Foreign Key -> `seller_profiles(id)` ON DELETE CASCADE
- `chat_id`: BIGINT, NOT NULL
- `message_payload`: TEXT, NOT NULL
- `sent_at`: TIMESTAMP WITH TIME ZONE, NULLABLE
- `is_delivered`: BOOLEAN, DEFAULT FALSE
- `retry_count`: INT, DEFAULT 0
- `error_message`: TEXT, NULLABLE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.15 `reviews`
Verified buyer reviews.
- `id`: UUID, Primary Key
- `order_id`: UUID, Foreign Key -> `orders(id)` ON DELETE RESTRICT
- `product_id`: UUID, Foreign Key -> `products(id)` ON DELETE RESTRICT
- `customer_id`: UUID, Foreign Key -> `users(id)` ON DELETE CASCADE
- `rating`: INT, NOT NULL (1 to 5)
- `comment`: TEXT, NOT NULL
- `image_url`: TEXT, NULLABLE
- `is_hidden`: BOOLEAN, DEFAULT FALSE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
- CONSTRAINT: UNIQUE(order_id, product_id)

### 3.16 `favorites`
Saved customer wishlist.
- `id`: UUID, Primary Key
- `user_id`: UUID, Foreign Key -> `users(id)` ON DELETE CASCADE
- `product_id`: UUID, Foreign Key -> `products(id)` ON DELETE CASCADE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
- CONSTRAINT: UNIQUE(user_id, product_id)

### 3.17 `notifications`
In-app notification inbox.
- `id`: UUID, Primary Key
- `user_id`: UUID, Foreign Key -> `users(id)` ON DELETE CASCADE
- `type`: NotificationType, NOT NULL
- `title`: VARCHAR(200), NOT NULL
- `message`: TEXT, NOT NULL
- `link_url`: VARCHAR(255), NULLABLE
- `is_read`: BOOLEAN, DEFAULT FALSE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.18 `custom_orders`
Direct requests for custom themed cakes and bespoke sweets.
- `id`: UUID, Primary Key
- `customer_id`: UUID, Foreign Key -> `users(id)` ON DELETE CASCADE
- `seller_id`: UUID, Foreign Key -> `seller_profiles(id)` ON DELETE CASCADE
- `description`: TEXT, NOT NULL
- `reference_image_url`: TEXT, NULLABLE
- `requested_date`: DATE, NOT NULL
- `budget_min`: DECIMAL(12, 2), NULLABLE
- `budget_max`: DECIMAL(12, 2), NULLABLE
- `status`: VARCHAR(50), DEFAULT 'PENDING'
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.19 `reports`
User-submitted flagging of inappropriate items or stores.
- `id`: UUID, Primary Key
- `reporter_user_id`: UUID, Foreign Key -> `users(id)` ON DELETE SET NULL
- `target_type`: ReportTargetType, NOT NULL
- `target_id`: UUID, NOT NULL
- `reason`: TEXT, NOT NULL
- `status`: ReportStatus, DEFAULT 'PENDING'
- `resolution_notes`: TEXT, NULLABLE
- `resolved_by_user_id`: UUID, Foreign Key -> `users(id)` NULLABLE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.20 `audit_logs`
Immutable compliance and administrative action log.
- `id`: UUID, Primary Key
- `user_id`: UUID, Foreign Key -> `users(id)` ON DELETE SET NULL
- `action`: VARCHAR(100), NOT NULL (e.g. "APPROVE_SELLER", "SUSPEND_USER", "DELETE_PRODUCT")
- `entity`: VARCHAR(100), NOT NULL
- `entity_id`: VARCHAR(100), NOT NULL
- `metadata`: JSONB, NULLABLE
- `ip_address`: VARCHAR(45), NULLABLE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.21 `refresh_tokens`
Token rotation ledger for JWT renewal.
- `id`: UUID, Primary Key
- `user_id`: UUID, Foreign Key -> `users(id)` ON DELETE CASCADE
- `token_hash`: VARCHAR(255), UNIQUE, NOT NULL
- `expires_at`: TIMESTAMP WITH TIME ZONE, NOT NULL
- `revoked`: BOOLEAN, DEFAULT FALSE
- `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

### 3.22 `platform_settings`
Configurable operational parameters.
- `key`: VARCHAR(100), Primary Key
- `value`: JSONB, NOT NULL
- `updated_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

