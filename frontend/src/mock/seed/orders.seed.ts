import { DeliveryOrder } from "@/types";

export const SEED_ORDERS: DeliveryOrder[] = [
  {
    id: "ord-001",
    orderNumber: "ORD-2026-0814-01",
    type: "DELIVERY",
    customerId: "usr-cust-1",
    customerName: "Siti Rahma (CV Fresh Frozen Nusantara)",
    customerPhone: "081809876543",
    goodsItemIds: ["brg-004"],
    goodsSummary: "Solid Teak Wood Dining Tables (Set of 6)",
    totalVolumeM3: 1.7,
    totalWeightKg: 350,
    requiresReefer: false,

    originAddress: "Gudang Utama Cakung Logistics Hub, RAK-F03",
    originCity: "Jakarta Timur",
    destinationAddress: "Restoran Nusantara Rasa, Jl. Senopati No. 18",
    destinationCity: "Jakarta Selatan",

    scheduledDate: "2026-08-16",
    scheduledTimeSlot: "14:00 - 17:00",

    driverId: "usr-driver-1",
    driverName: "Agus Pratama",
    driverPhone: "085711223344",

    vehicleId: "veh-02",
    vehiclePlate: "B 9412 WMS",
    vehicleType: "BOX_TRUCK_SMALL",

    status: "IN_TRANSIT",
    estimatedDurationMins: 45,
    distanceKm: 22.4,

    confirmedByCustomer: false,
    confirmedByDriver: true,
    confirmedByAdmin: true,

    createdAt: "2026-08-14T14:00:00Z",
    updatedAt: "2026-08-16T13:30:00Z",
  },
  {
    id: "ord-002",
    orderNumber: "ORD-2026-0816-02",
    type: "PICKUP",
    customerId: "usr-cust-1",
    customerName: "Siti Rahma (CV Fresh Frozen Nusantara)",
    customerPhone: "081809876543",
    goodsItemIds: ["brg-001"],
    goodsSummary: "30 Master Box Norwegian Salmon Fillet",
    totalVolumeM3: 0.96,
    totalWeightKg: 450,
    requiresReefer: true,

    originAddress: "Pelabuhan Muara Baru Dermaga Timur No. 8",
    originCity: "Jakarta Utara",
    destinationAddress: "Gudang Utama Cakung Logistics Hub (Cold Zone)",
    destinationCity: "Jakarta Timur",

    scheduledDate: "2026-08-17",
    scheduledTimeSlot: "08:00 - 11:00",

    status: "PENDING_ASSIGNMENT",
    estimatedDurationMins: 55,
    distanceKm: 28.0,

    confirmedByCustomer: false,
    confirmedByDriver: false,
    confirmedByAdmin: false,

    createdAt: "2026-08-16T10:00:00Z",
    updatedAt: "2026-08-16T10:00:00Z",
  },
];
