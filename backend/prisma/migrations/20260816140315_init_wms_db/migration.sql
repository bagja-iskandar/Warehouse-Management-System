-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CUSTOMER', 'DRIVER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "StorageZoneType" AS ENUM ('STANDARD', 'COLD_STORAGE', 'HEAVY_DUTY');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "GoodsCategory" AS ENUM ('FURNITURE', 'COLD_FOOD', 'GENERAL_ELECTRONICS', 'TEXTILE');

-- CreateEnum
CREATE TYPE "GoodsStorageStatus" AS ENUM ('DRAFT', 'PENDING_PICKUP', 'IN_TRANSIT_INBOUND', 'INSPECTING', 'STORED', 'PENDING_DELIVERY', 'IN_TRANSIT_OUTBOUND', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('VAN', 'BOX_TRUCK_SMALL', 'REEFER_TRUCK', 'WING_BOX_LARGE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_SERVICE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_ASSIGNMENT', 'DRIVER_ASSIGNED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DESTINATION', 'DELIVERED', 'CONFIRMED', 'DELAYED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'QRIS', 'VIRTUAL_ACCOUNT');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('BILLING_DUE', 'PAYMENT_RECEIVED', 'GOODS_STORED', 'GOODS_INSPECTED', 'DRIVER_DISPATCHED', 'DELIVERY_ARRIVED', 'SCHEDULE_DELAY', 'CONFIRMATION_REQUIRED');

-- CreateEnum
CREATE TYPE "RelatedEntityType" AS ENUM ('GOODS', 'ORDER', 'INVOICE', 'WAREHOUSE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "phone" VARCHAR(30) NOT NULL,
    "avatar_url" TEXT,
    "company_name" VARCHAR(150),
    "address" TEXT,
    "driver_license_number" VARCHAR(50),
    "driver_license_expiry" DATE,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "total_capacity_m3" DECIMAL(10,2) NOT NULL,
    "used_capacity_m3" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "manager_name" VARCHAR(100) NOT NULL,
    "contact_phone" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_zones" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "StorageZoneType" NOT NULL,
    "capacity_m3" DECIMAL(10,2) NOT NULL,
    "used_m3" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "target_temp_min" DECIMAL(5,2),
    "target_temp_max" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_slots" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "zone_id" TEXT,
    "code" VARCHAR(30) NOT NULL,
    "zone" "StorageZoneType" NOT NULL,
    "capacity_m3" DECIMAL(10,2) NOT NULL,
    "used_m3" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "temperature_celsius" DECIMAL(5,2),
    "humidity_percent" DECIMAL(5,2),
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "storage_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_items" (
    "id" TEXT NOT NULL,
    "barcode" VARCHAR(50) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "slot_id" TEXT,
    "name" VARCHAR(200) NOT NULL,
    "category" "GoodsCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "length_cm" DECIMAL(10,2) NOT NULL,
    "width_cm" DECIMAL(10,2) NOT NULL,
    "height_cm" DECIMAL(10,2) NOT NULL,
    "volume_m3" DECIMAL(10,4) NOT NULL,
    "weight_kg" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" VARCHAR(50) NOT NULL,
    "requires_cold_storage" BOOLEAN NOT NULL DEFAULT false,
    "target_temp_min" DECIMAL(5,2),
    "target_temp_max" DECIMAL(5,2),
    "current_temp" DECIMAL(5,2),
    "storage_start_date" TIMESTAMPTZ(6) NOT NULL,
    "storage_end_date" TIMESTAMPTZ(6),
    "monthly_rental_fee" DECIMAL(14,2) NOT NULL,
    "status" "GoodsStorageStatus" NOT NULL DEFAULT 'DRAFT',
    "image_url" TEXT,
    "qr_code_data" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "goods_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_mutations" (
    "id" TEXT NOT NULL,
    "goods_id" TEXT NOT NULL,
    "status" "GoodsStorageStatus" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" VARCHAR(100) NOT NULL,
    "actor_role" VARCHAR(50) NOT NULL,
    "location" VARCHAR(150),
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_mutations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "plate_number" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "VehicleType" NOT NULL,
    "max_weight_kg" DECIMAL(10,2) NOT NULL,
    "max_volume_m3" DECIMAL(10,2) NOT NULL,
    "has_refrigeration" BOOLEAN NOT NULL DEFAULT false,
    "min_temp_celsius" DECIMAL(5,2),
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "current_driver_id" TEXT,
    "location_city" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_orders" (
    "id" TEXT NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "type" "OrderType" NOT NULL,
    "customer_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "vehicle_id" TEXT,
    "goods_summary" TEXT NOT NULL,
    "total_volume_m3" DECIMAL(10,4) NOT NULL,
    "total_weight_kg" DECIMAL(10,2) NOT NULL,
    "requires_reefer" BOOLEAN NOT NULL DEFAULT false,
    "origin_address" TEXT NOT NULL,
    "origin_city" VARCHAR(100) NOT NULL,
    "destination_address" TEXT NOT NULL,
    "destination_city" VARCHAR(100) NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "scheduled_time_slot" VARCHAR(50) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    "estimated_duration_mins" INTEGER NOT NULL DEFAULT 0,
    "distance_km" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    "is_delayed" BOOLEAN NOT NULL DEFAULT false,
    "delay_reason" TEXT,
    "rescheduled_time" TIMESTAMPTZ(6),
    "proof_of_delivery_url" TEXT,
    "recipient_name" VARCHAR(100),
    "recipient_signature" TEXT,
    "driver_rating" DECIMAL(3,2),
    "confirmed_by_customer" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_by_driver" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_by_admin" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "goods_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "billing_month" VARCHAR(50) NOT NULL,
    "issue_date" TIMESTAMPTZ(6) NOT NULL,
    "due_date" TIMESTAMPTZ(6) NOT NULL,
    "paid_date" TIMESTAMPTZ(6),
    "subtotal" DECIMAL(14,2) NOT NULL,
    "penalty_fee" DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "payment_method" "PaymentMethod",
    "payment_proof_url" TEXT,
    "verified_by_admin_id" TEXT,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "goods_id" TEXT,
    "description" VARCHAR(255) NOT NULL,
    "goods_name" VARCHAR(200),
    "volume_m3" DECIMAL(10,4) NOT NULL,
    "rate_per_m3" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_logs" (
    "id" BIGSERIAL NOT NULL,
    "slot_id" TEXT,
    "vehicle_id" TEXT,
    "temperature_celsius" DECIMAL(5,2) NOT NULL,
    "humidity_percent" DECIMAL(5,2),
    "is_anomaly" BOOLEAN NOT NULL DEFAULT false,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_notifications" (
    "id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "recipient_role" "UserRole" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "related_entity_id" VARCHAR(100),
    "related_entity_type" "RelatedEntityType",
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "warehouses_city_idx" ON "warehouses"("city");

-- CreateIndex
CREATE INDEX "warehouses_is_active_idx" ON "warehouses"("is_active");

-- CreateIndex
CREATE INDEX "storage_zones_warehouse_id_idx" ON "storage_zones"("warehouse_id");

-- CreateIndex
CREATE INDEX "storage_zones_type_idx" ON "storage_zones"("type");

-- CreateIndex
CREATE INDEX "storage_slots_warehouse_id_status_idx" ON "storage_slots"("warehouse_id", "status");

-- CreateIndex
CREATE INDEX "storage_slots_zone_idx" ON "storage_slots"("zone");

-- CreateIndex
CREATE UNIQUE INDEX "storage_slots_warehouse_id_code_key" ON "storage_slots"("warehouse_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "goods_items_barcode_key" ON "goods_items"("barcode");

-- CreateIndex
CREATE INDEX "goods_items_customer_id_idx" ON "goods_items"("customer_id");

-- CreateIndex
CREATE INDEX "goods_items_warehouse_id_status_idx" ON "goods_items"("warehouse_id", "status");

-- CreateIndex
CREATE INDEX "goods_items_slot_id_idx" ON "goods_items"("slot_id");

-- CreateIndex
CREATE INDEX "goods_items_category_idx" ON "goods_items"("category");

-- CreateIndex
CREATE INDEX "goods_mutations_goods_id_idx" ON "goods_mutations"("goods_id");

-- CreateIndex
CREATE INDEX "goods_mutations_timestamp_idx" ON "goods_mutations"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "vehicles"("plate_number");

-- CreateIndex
CREATE INDEX "vehicles_type_status_idx" ON "vehicles"("type", "status");

-- CreateIndex
CREATE INDEX "vehicles_current_driver_id_idx" ON "vehicles"("current_driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_orders_order_number_key" ON "delivery_orders"("order_number");

-- CreateIndex
CREATE INDEX "delivery_orders_customer_id_idx" ON "delivery_orders"("customer_id");

-- CreateIndex
CREATE INDEX "delivery_orders_driver_id_status_idx" ON "delivery_orders"("driver_id", "status");

-- CreateIndex
CREATE INDEX "delivery_orders_scheduled_date_idx" ON "delivery_orders"("scheduled_date");

-- CreateIndex
CREATE INDEX "order_items_goods_id_idx" ON "order_items"("goods_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_id_goods_id_key" ON "order_items"("order_id", "goods_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_customer_id_status_idx" ON "invoices"("customer_id", "status");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "telemetry_logs_slot_id_recorded_at_idx" ON "telemetry_logs"("slot_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "telemetry_logs_vehicle_id_recorded_at_idx" ON "telemetry_logs"("vehicle_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "telemetry_logs_is_anomaly_idx" ON "telemetry_logs"("is_anomaly");

-- CreateIndex
CREATE INDEX "system_notifications_recipient_user_id_is_read_idx" ON "system_notifications"("recipient_user_id", "is_read");

-- CreateIndex
CREATE INDEX "system_notifications_created_at_idx" ON "system_notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_zones" ADD CONSTRAINT "storage_zones_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_slots" ADD CONSTRAINT "storage_slots_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_slots" ADD CONSTRAINT "storage_slots_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "storage_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_items" ADD CONSTRAINT "goods_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_items" ADD CONSTRAINT "goods_items_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_items" ADD CONSTRAINT "goods_items_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "storage_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_mutations" ADD CONSTRAINT "goods_mutations_goods_id_fkey" FOREIGN KEY ("goods_id") REFERENCES "goods_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_mutations" ADD CONSTRAINT "goods_mutations_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_current_driver_id_fkey" FOREIGN KEY ("current_driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "delivery_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_goods_id_fkey" FOREIGN KEY ("goods_id") REFERENCES "goods_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_verified_by_admin_id_fkey" FOREIGN KEY ("verified_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_goods_id_fkey" FOREIGN KEY ("goods_id") REFERENCES "goods_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_logs" ADD CONSTRAINT "telemetry_logs_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "storage_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_logs" ADD CONSTRAINT "telemetry_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
