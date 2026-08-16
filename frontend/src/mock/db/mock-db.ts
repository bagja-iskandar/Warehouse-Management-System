import {
  UserProfile,
  WarehouseDetail,
  GoodsItem,
  Vehicle,
  DeliveryOrder,
  Invoice,
  SystemNotification,
} from "@/types";
import { SEED_USERS } from "../seed/users.seed";
import { SEED_WAREHOUSES } from "../seed/warehouses.seed";
import { SEED_GOODS } from "../seed/goods.seed";
import { SEED_VEHICLES } from "../seed/vehicles.seed";
import { SEED_ORDERS } from "../seed/orders.seed";
import { SEED_INVOICES } from "../seed/invoices.seed";
import { SEED_NOTIFICATIONS } from "../seed/notifications.seed";

interface MockStorageSchema {
  users: UserProfile[];
  warehouses: WarehouseDetail[];
  goods: GoodsItem[];
  vehicles: Vehicle[];
  orders: DeliveryOrder[];
  invoices: Invoice[];
  notifications: SystemNotification[];
}

const STORAGE_KEY = "WMS_REWORK_MOCK_DB_V1";

class MockDatabase {
  private data: MockStorageSchema;

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): MockStorageSchema {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (err) {
        console.warn("Failed to load mock DB from localStorage:", err);
      }
    }

    return {
      users: [...SEED_USERS],
      warehouses: [...SEED_WAREHOUSES],
      goods: [...SEED_GOODS],
      vehicles: [...SEED_VEHICLES],
      orders: [...SEED_ORDERS],
      invoices: [...SEED_INVOICES],
      notifications: [...SEED_NOTIFICATIONS],
    };
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (err) {
        console.warn("Failed to persist mock DB to localStorage:", err);
      }
    }
  }

  // Simulated latency helper
  private async delay(ms: number = 200) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- USERS ---
  async getUsers(): Promise<UserProfile[]> {
    await this.delay(100);
    return [...this.data.users];
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    await this.delay(100);
    return this.data.users.find((u) => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    await this.delay(150);
    return (
      this.data.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      ) || null
    );
  }

  async createUser(user: UserProfile): Promise<UserProfile> {
    await this.delay(200);
    this.data.users.push(user);
    this.persist();
    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    await this.delay(200);
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found.`);
    }
    const updatedUser = { ...this.data.users[index], ...updates };
    this.data.users[index] = updatedUser;
    this.persist();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.delay(200);
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.persist();
    return true;
  }

  // --- WAREHOUSES ---
  async getWarehouses(): Promise<WarehouseDetail[]> {
    await this.delay(150);
    return [...this.data.warehouses];
  }

  async getWarehouseById(id: string): Promise<WarehouseDetail | null> {
    await this.delay(100);
    return this.data.warehouses.find((w) => w.id === id) || null;
  }

  // --- GOODS ---
  async getGoods(customerId?: string): Promise<GoodsItem[]> {
    await this.delay(200);
    if (customerId) {
      return this.data.goods.filter((g) => g.customerId === customerId);
    }
    return [...this.data.goods];
  }

  async getGoodsById(id: string): Promise<GoodsItem | null> {
    await this.delay(100);
    return this.data.goods.find((g) => g.id === id) || null;
  }

  async createGoods(goods: GoodsItem): Promise<GoodsItem> {
    await this.delay(250);
    this.data.goods.unshift(goods);
    this.persist();
    return goods;
  }

  async updateGoodsStatus(
    id: string,
    status: GoodsItem["status"],
    note?: string
  ): Promise<GoodsItem> {
    await this.delay(200);
    const item = this.data.goods.find((g) => g.id === id);
    if (!item) throw new Error(`Goods item ${id} not found`);

    item.status = status;
    item.updatedAt = new Date().toISOString();
    if (note) {
      item.history.push({
        id: `hist-${Date.now()}`,
        goodsId: item.id,
        status,
        title: `Status: ${status}`,
        description: note,
        actorName: "System Operator",
        actorRole: "Admin",
        timestamp: new Date().toISOString(),
      });
    }

    this.persist();
    return { ...item };
  }

  // --- VEHICLES ---
  async getVehicles(): Promise<Vehicle[]> {
    await this.delay(150);
    return [...this.data.vehicles];
  }

  async assignVehicleDriver(vehicleId: string, driverId: string, driverName: string): Promise<Vehicle> {
    await this.delay(200);
    const v = this.data.vehicles.find((x) => x.id === vehicleId);
    if (!v) throw new Error("Vehicle not found");
    v.currentDriverId = driverId;
    v.currentDriverName = driverName;
    v.status = "IN_SERVICE";
    this.persist();
    return { ...v };
  }

  // --- ORDERS ---
  async getOrders(driverId?: string, customerId?: string): Promise<DeliveryOrder[]> {
    await this.delay(200);
    let results = [...this.data.orders];
    if (driverId) results = results.filter((o) => o.driverId === driverId);
    if (customerId) results = results.filter((o) => o.customerId === customerId);
    return results;
  }

  async createOrder(order: DeliveryOrder): Promise<DeliveryOrder> {
    await this.delay(250);
    this.data.orders.unshift(order);
    this.persist();
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: DeliveryOrder["status"]
  ): Promise<DeliveryOrder> {
    await this.delay(200);
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    order.status = status;
    order.updatedAt = new Date().toISOString();
    this.persist();
    return { ...order };
  }

  // --- INVOICES ---
  async getInvoices(customerId?: string): Promise<Invoice[]> {
    await this.delay(200);
    if (customerId) {
      return this.data.invoices.filter((i) => i.customerId === customerId);
    }
    return [...this.data.invoices];
  }

  async payInvoice(
    invoiceId: string,
    method: Invoice["paymentMethod"],
    proofUrl: string
  ): Promise<Invoice> {
    await this.delay(300);
    const inv = this.data.invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new Error("Invoice not found");
    inv.status = "PAID";
    inv.paymentMethod = method;
    inv.paymentProofUrl = proofUrl;
    inv.paidDate = new Date().toISOString();
    this.persist();
    return { ...inv };
  }

  // --- NOTIFICATIONS ---
  async getNotifications(userId?: string): Promise<SystemNotification[]> {
    await this.delay(100);
    if (userId) {
      return this.data.notifications.filter((n) => n.recipientUserId === userId);
    }
    return [...this.data.notifications];
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    await this.delay(100);
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
    this.persist();
    return true;
  }

  // Reset helper for testing / demo
  resetToDefaults() {
    this.data = {
      users: [...SEED_USERS],
      warehouses: [...SEED_WAREHOUSES],
      goods: [...SEED_GOODS],
      vehicles: [...SEED_VEHICLES],
      orders: [...SEED_ORDERS],
      invoices: [...SEED_INVOICES],
      notifications: [...SEED_NOTIFICATIONS],
    };
    this.persist();
  }
}

export const mockDb = new MockDatabase();
