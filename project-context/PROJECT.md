# Warehouse Management System — Project Context

## 1. Project Overview

**Project Name:** Warehouse Management System

**Project Type:** Web-based Warehouse Management & Logistics System

**Development Approach:** Rework and modernization of an existing warehouse management project.

**Current Priority:** Frontend development first.

This project is a rework of an existing **Sistem Penyimpanan Barang/Gudang**.

The existing SRS document is the primary functional reference for this project.

The purpose of this rework is to transform the existing system into a more structured, maintainable, professional, scalable, and user-friendly web application.

The system is intended to support warehouse storage operations, goods management, monitoring, pickup and delivery, scheduling, payment, notification, and reporting.

---

# 2. Business Objective

The main objective of the system is to improve:

- Efficiency
- Accuracy
- Control
- Visibility
- Warehouse capacity management
- Goods management
- Delivery management
- Monitoring of stored goods

The system should provide accurate and, where applicable, real-time information regarding warehouse conditions and goods.

The system should support the operational lifecycle of stored goods, starting from storage requests and goods input through warehouse operations, pickup, delivery, monitoring, payment, and reporting.

---

# 3. Primary Users

The system has three primary user roles.

## 3.1 Admin

Admin manages warehouse and operational activities.

Expected responsibilities include:

- Managing warehouse information
- Managing warehouse capacity
- Managing goods
- Monitoring stored goods
- Managing customers
- Managing drivers
- Managing delivery activities
- Managing payments
- Creating reports
- Managing user accounts
- Monitoring warehouse operations

---

## 3.2 Customer

Customer uses the system to manage their warehouse storage activities.

Expected responsibilities include:

- Viewing warehouse information
- Requesting storage
- Inputting goods
- Viewing stored goods
- Monitoring goods
- Viewing delivery information
- Scheduling pickup
- Making payments
- Viewing payment history
- Viewing goods history
- Receiving notifications
- Confirming received goods

---

## 3.3 Driver

Driver is responsible for pickup and delivery operations.

Expected responsibilities include:

- Viewing assigned pickup/delivery tasks
- Selecting available vehicles
- Viewing schedules
- Performing pickup
- Performing delivery
- Confirming goods
- Updating delivery status
- Viewing route/location information
- Viewing delivery history

---

# 4. Core Functional Areas

The application should eventually support the following functional areas.

## 4.1 Authentication & Account

- Create account
- Login
- Email verification
- Edit profile
- Role-based access
- Account management
- Delete account where authorized

---

## 4.2 Warehouse Management

- Warehouse information
- Storage capacity
- Storage availability
- Storage status
- Warehouse monitoring

The system should provide information about available warehouse capacity so users can understand storage availability.

---

## 4.3 Goods / Inventory Management

- Input goods
- Goods categories
- Goods details
- Quantity
- Size/dimensions
- Storage status
- Goods history
- Goods confirmation
- Goods monitoring

The original system requirements describe goods input containing information such as:

- Goods type
- Goods name
- Description
- Size
- Quantity

The system should validate goods data before storage.

---

## 4.4 Pickup & Delivery

- Pickup request
- Delivery request
- Scheduling
- Driver assignment
- Vehicle selection
- Pickup confirmation
- Delivery confirmation
- Delivery status
- Route information
- Tracking

The system should support information about the driver handling a delivery and allow users to monitor the movement of goods.

---

## 4.5 Scheduling

The system should support scheduling for:

- Goods pickup
- Goods delivery

Scheduling may involve:

- Customer
- Driver
- Admin

The system should also support dynamic scheduling and delivery delay management where required by the product design.

---

## 4.6 Payment

The system should support:

- Monthly/subscription payment
- Payment status
- Payment notification
- Payment history
- Payment proof
- Late-payment penalty

The original SRS describes monthly/subscription payment and notification regarding payment deadlines.

---

## 4.7 Notification

Notifications may be related to:

- Payment
- Goods arrival
- Pickup
- Delivery
- Schedule
- Goods status
- Goods confirmation

The system should notify relevant users based on the event.

---

## 4.8 Monitoring

Monitoring should provide visibility into:

- Goods status
- Goods condition
- Goods location
- Warehouse status
- Delivery status

Admin should be able to monitor goods stored in the warehouse.

---

## 4.9 Reports

Admin should eventually be able to create reports related to:

- Warehouse activities
- Goods
- Storage
- Delivery
- Payment
- Monitoring

---

## 4.10 History

Users should be able to view relevant historical information.

Examples:

- Goods history
- Storage history
- Pickup history
- Delivery history
- Payment history

---

# 5. Frontend-First Development Strategy

The initial development priority is the **frontend**.

The frontend should be developed as a complete, coherent, and professional application interface before deep backend integration begins.

However, the frontend architecture must be designed for future backend integration.

Do not build the frontend around hardcoded values that will be difficult to replace later.

When backend APIs are not available, use:

- Mock data
- Mock services
- TypeScript interfaces
- Service abstraction

Mock implementations should be replaceable with real API calls without requiring a major rewrite of the UI.

---

# 6. Target Frontend Technology

The planned frontend stack is:

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Lucide React**
- **TanStack Query**
- **React Hook Form**
- **Zod**
- **Recharts**

### Optional

**Zustand** may be introduced only when client-side global state is actually required.

Do not introduce additional libraries without a clear technical reason.

Avoid unnecessary dependencies and overengineering.

---

# 7. Frontend Architecture

The frontend should follow a clear separation of concerns.

Conceptually:

```text
UI
 ↓
Components
 ↓
Hooks
 ↓
State / Query
 ↓
Service Layer
 ↓
API
 ↓
Backend