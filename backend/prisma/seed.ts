import { PrismaClient, UserRole, UserStatus, StorageZoneType, SlotStatus, GoodsCategory, GoodsStorageStatus, VehicleType, VehicleStatus, OrderType, OrderStatus, InvoiceStatus, PaymentMethod, NotificationCategory, RelatedEntityType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for WMS Nusantara...');

  // 1. Clean existing records in reverse dependency order (excluding users to protect passwords)
  console.log('🧹 Cleaning existing transactional tables...');
  await prisma.auditLog.deleteMany();
  await prisma.systemNotification.deleteMany();
  await prisma.telemetryLog.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.goodsMutation.deleteMany();
  await prisma.goodsItem.deleteMany();
  await prisma.storageSlot.deleteMany();
  await prisma.storageZone.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.refreshToken.deleteMany();

  // 2. Seed Users (Idempotent: Only creates if user does not already exist, preserving passwords)
  console.log('👤 Seeding Users (Preserving existing user accounts & passwords)...');
  // Standard development password for fresh accounts: "Password123!"
  const standardPasswordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@wms.id' },
    update: {},
    create: {
      id: 'usr-admin-1',
      name: 'Budi Santoso (Admin)',
      email: 'admin@wms.id',
      passwordHash: standardPasswordHash,
      role: UserRole.ADMIN,
      phone: '081234567890',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      companyName: 'PT Logistik Prima Nusantara',
      address: 'Kawasan Industri Pulo Gadung, Jakarta Timur',
      status: UserStatus.ACTIVE,
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: 'customer@freshfoods.id' },
    update: {},
    create: {
      id: 'usr-cust-1',
      name: 'Siti Rahma (Customer - Fresh Foods)',
      email: 'customer@freshfoods.id',
      passwordHash: standardPasswordHash,
      role: UserRole.CUSTOMER,
      phone: '081809876543',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      companyName: 'CV Fresh Frozen Nusantara',
      address: 'Jl. Sudirman No. 45, Jakarta Selatan',
      status: UserStatus.ACTIVE,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'michael@megafurniture.co.id' },
    update: {},
    create: {
      id: 'usr-cust-2',
      name: 'Michael Tan (Customer - Mega Furniture)',
      email: 'michael@megafurniture.co.id',
      passwordHash: standardPasswordHash,
      role: UserRole.CUSTOMER,
      phone: '081987654321',
      companyName: 'PT Mega Furniture Indo',
      address: 'Jl. Gatot Subroto Kav. 18, Jakarta Selatan',
      status: UserStatus.ACTIVE,
    },
  });

  const driver1 = await prisma.user.upsert({
    where: { email: 'driver@wms.id' },
    update: {},
    create: {
      id: 'usr-driver-1',
      name: 'Agus Pratama (Driver)',
      email: 'driver@wms.id',
      passwordHash: standardPasswordHash,
      role: UserRole.DRIVER,
      phone: '085711223344',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      companyName: 'PT Logistik Prima Nusantara (Armada)',
      address: 'Jl. Raya Bekasi KM 18, Cakung',
      driverLicenseNumber: 'SIM-B2-981249012',
      status: UserStatus.ACTIVE,
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { email: 'dedi.driver@wms.id' },
    update: {},
    create: {
      id: 'usr-driver-2',
      name: 'Dedi Kurniawan (Driver)',
      email: 'dedi.driver@wms.id',
      passwordHash: standardPasswordHash,
      role: UserRole.DRIVER,
      phone: '085899887766',
      companyName: 'PT Logistik Prima Nusantara (Armada)',
      address: 'Jl. Soekarno Hatta No. 45, Bandung',
      driverLicenseNumber: 'SIM-B2-882341092',
      status: UserStatus.ACTIVE,
    },
  });

  // 3. Seed Warehouses
  console.log('🏭 Seeding Warehouses & Storage Zones...');
  const whCakung = await prisma.warehouse.create({
    data: {
      id: 'wh-jkt-central',
      code: 'WH-CKG-01',
      name: 'Gudang Utama Cakung Logistics Hub',
      address: 'Kawasan Industri Pulo Gadung Kav. 12-14',
      city: 'Jakarta Timur',
      totalCapacityM3: 5000.0,
      usedCapacityM3: 3150.0,
      isActive: true,
      managerName: 'Hendra Wijaya',
      contactPhone: '021-4609876',
    },
  });

  const whBandung = await prisma.warehouse.create({
    data: {
      id: 'wh-bdg-01',
      code: 'WH-BDG-01',
      name: 'Gudang Distribusi Gedebage Cold Hub',
      address: 'Jl. Soekarno Hatta No. 788',
      city: 'Bandung',
      totalCapacityM3: 3000.0,
      usedCapacityM3: 1400.0,
      isActive: true,
      managerName: 'Rian Nugraha',
      contactPhone: '022-7561234',
    },
  });

  // 4. Seed Storage Zones
  const zoneCakungCold = await prisma.storageZone.create({
    data: {
      id: 'zone-ckg-cold',
      warehouseId: whCakung.id,
      name: 'Zona Cold Storage Sub-Zero',
      type: StorageZoneType.COLD_STORAGE,
      capacityM3: 1500.0,
      usedM3: 850.0,
      targetTempMin: -25.0,
      targetTempMax: -18.0,
    },
  });

  const zoneCakungStd = await prisma.storageZone.create({
    data: {
      id: 'zone-ckg-std',
      warehouseId: whCakung.id,
      name: 'Zona Standar Rak Bertingkat Lantai 1-3',
      type: StorageZoneType.STANDARD,
      capacityM3: 3500.0,
      usedM3: 2300.0,
    },
  });

  const zoneBandungCold = await prisma.storageZone.create({
    data: {
      id: 'zone-bdg-cold',
      warehouseId: whBandung.id,
      name: 'Zona Cold Storage Gedebage',
      type: StorageZoneType.COLD_STORAGE,
      capacityM3: 1200.0,
      usedM3: 600.0,
      targetTempMin: -25.0,
      targetTempMax: -18.0,
    },
  });

  const zoneBandungStd = await prisma.storageZone.create({
    data: {
      id: 'zone-bdg-std',
      warehouseId: whBandung.id,
      name: 'Zona Standar Gedebage',
      type: StorageZoneType.STANDARD,
      capacityM3: 1800.0,
      usedM3: 800.0,
    },
  });

  // 5. Seed Storage Slots
  console.log('📦 Seeding Storage Slots...');
  const slotC01 = await prisma.storageSlot.create({
    data: {
      id: 'slot-c01',
      warehouseId: whCakung.id,
      zoneId: zoneCakungCold.id,
      code: 'COLD-A01',
      zone: StorageZoneType.COLD_STORAGE,
      capacityM3: 100.0,
      usedM3: 85.0,
      temperatureCelsius: -18.5,
      humidityPercent: 85.0,
      status: SlotStatus.OCCUPIED,
    },
  });

  const slotC02 = await prisma.storageSlot.create({
    data: {
      id: 'slot-c02',
      warehouseId: whCakung.id,
      zoneId: zoneCakungCold.id,
      code: 'COLD-A02',
      zone: StorageZoneType.COLD_STORAGE,
      capacityM3: 100.0,
      usedM3: 60.0,
      temperatureCelsius: -20.0,
      humidityPercent: 82.0,
      status: SlotStatus.OCCUPIED,
    },
  });

  const slotC03 = await prisma.storageSlot.create({
    data: {
      id: 'slot-c03',
      warehouseId: whCakung.id,
      zoneId: zoneCakungCold.id,
      code: 'COLD-A03',
      zone: StorageZoneType.COLD_STORAGE,
      capacityM3: 100.0,
      usedM3: 0.0,
      temperatureCelsius: -19.0,
      humidityPercent: 80.0,
      status: SlotStatus.AVAILABLE,
    },
  });

  const slotS01 = await prisma.storageSlot.create({
    data: {
      id: 'slot-s01',
      warehouseId: whCakung.id,
      zoneId: zoneCakungStd.id,
      code: 'RAK-F01',
      zone: StorageZoneType.STANDARD,
      capacityM3: 200.0,
      usedM3: 190.0,
      temperatureCelsius: 24.0,
      humidityPercent: 55.0,
      status: SlotStatus.OCCUPIED,
    },
  });

  const slotS02 = await prisma.storageSlot.create({
    data: {
      id: 'slot-s02',
      warehouseId: whCakung.id,
      zoneId: zoneCakungStd.id,
      code: 'RAK-F02',
      zone: StorageZoneType.STANDARD,
      capacityM3: 200.0,
      usedM3: 0.0,
      status: SlotStatus.AVAILABLE,
    },
  });

  const slotS03 = await prisma.storageSlot.create({
    data: {
      id: 'slot-s03',
      warehouseId: whCakung.id,
      zoneId: zoneCakungStd.id,
      code: 'RAK-F03',
      zone: StorageZoneType.STANDARD,
      capacityM3: 200.0,
      usedM3: 120.0,
      status: SlotStatus.OCCUPIED,
    },
  });

  const slotBdgC01 = await prisma.storageSlot.create({
    data: {
      id: 'slot-bdg-c01',
      warehouseId: whBandung.id,
      zoneId: zoneBandungCold.id,
      code: 'COLD-B01',
      zone: StorageZoneType.COLD_STORAGE,
      capacityM3: 100.0,
      usedM3: 80.0,
      temperatureCelsius: -19.2,
      humidityPercent: 82.0,
      status: SlotStatus.OCCUPIED,
    },
  });

  const slotBdgC02 = await prisma.storageSlot.create({
    data: {
      id: 'slot-bdg-c02',
      warehouseId: whBandung.id,
      zoneId: zoneBandungCold.id,
      code: 'COLD-B02',
      zone: StorageZoneType.COLD_STORAGE,
      capacityM3: 100.0,
      usedM3: 0.0,
      temperatureCelsius: -20.5,
      humidityPercent: 80.0,
      status: SlotStatus.AVAILABLE,
    },
  });

  const slotBdgS01 = await prisma.storageSlot.create({
    data: {
      id: 'slot-bdg-s01',
      warehouseId: whBandung.id,
      zoneId: zoneBandungStd.id,
      code: 'RAK-B01',
      zone: StorageZoneType.STANDARD,
      capacityM3: 200.0,
      usedM3: 150.0,
      temperatureCelsius: 23.5,
      humidityPercent: 58.0,
      status: SlotStatus.OCCUPIED,
    },
  });

  const slotBdgS02 = await prisma.storageSlot.create({
    data: {
      id: 'slot-bdg-s02',
      warehouseId: whBandung.id,
      zoneId: zoneBandungStd.id,
      code: 'RAK-B02',
      zone: StorageZoneType.STANDARD,
      capacityM3: 200.0,
      usedM3: 0.0,
      status: SlotStatus.AVAILABLE,
    },
  });

  // 6. Seed Vehicles
  console.log('🚚 Seeding Vehicles...');
  const veh01 = await prisma.vehicle.create({
    data: {
      id: 'veh-01',
      plateNumber: 'B 9821 WMS',
      name: 'Isuzu Giga Reefer Cold Truck 5T',
      type: VehicleType.REEFER_TRUCK,
      maxWeightKg: 5000.0,
      maxVolumeM3: 18.0,
      hasRefrigeration: true,
      minTempCelsius: -25.0,
      status: VehicleStatus.AVAILABLE,
      currentDriverId: driver1.id,
      locationCity: 'Jakarta Timur (Cakung Pool)',
    },
  });

  const veh02 = await prisma.vehicle.create({
    data: {
      id: 'veh-02',
      plateNumber: 'B 9412 WMS',
      name: 'Mitsubishi Fuso Box Medium 4T',
      type: VehicleType.BOX_TRUCK_SMALL,
      maxWeightKg: 4000.0,
      maxVolumeM3: 14.0,
      hasRefrigeration: false,
      status: VehicleStatus.AVAILABLE,
      locationCity: 'Jakarta Timur (Cakung Pool)',
    },
  });

  const veh03 = await prisma.vehicle.create({
    data: {
      id: 'veh-03',
      plateNumber: 'B 9103 WMS',
      name: 'Toyota HiAce Cargo Van 1.5T',
      type: VehicleType.VAN,
      maxWeightKg: 1500.0,
      maxVolumeM3: 6.0,
      hasRefrigeration: false,
      status: VehicleStatus.IN_SERVICE,
      locationCity: 'Jakarta Selatan (In-Transit)',
    },
  });

  // 7. Seed Goods Items
  console.log('🥩 Seeding Goods Items & Mutation Histories...');
  const goods01 = await prisma.goodsItem.create({
    data: {
      id: 'brg-001',
      barcode: 'BRG-2026-FROZEN-001',
      customerId: customer1.id,
      warehouseId: whCakung.id,
      slotId: slotC01.id,
      name: 'Norwegian Salmon Fillet Grade A',
      category: GoodsCategory.COLD_FOOD,
      description: 'Ikan salmon beku kualitas ekspor dalam kemasan insulated box vakum.',
      lengthCm: 120.0,
      widthCm: 80.0,
      heightCm: 100.0,
      volumeM3: 0.96,
      weightKg: 450.0,
      quantity: 30,
      unit: 'Master Box',
      requiresColdStorage: true,
      targetTempMin: -22.0,
      targetTempMax: -18.0,
      currentTemp: -19.4,
      storageStartDate: new Date('2026-08-01T09:00:00Z'),
      monthlyRentalFee: 2400000.0,
      status: GoodsStorageStatus.STORED,
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&auto=format&fit=crop&q=80',
      qrCodeData: 'WMS://ITEM/brg-001?code=BRG-2026-FROZEN-001',
      history: {
        create: [
          {
            id: 'hist-01',
            status: GoodsStorageStatus.PENDING_PICKUP,
            title: 'Permintaan Penjemputan Diajukan',
            description: 'Customer mengajukan input barang dan meminta penjemputan armada reefer.',
            actorName: 'Siti Rahma',
            actorRole: 'Customer',
            location: 'Kavling Cold Chain Sudirman',
            timestamp: new Date('2026-07-31T14:20:00Z'),
          },
          {
            id: 'hist-02',
            status: GoodsStorageStatus.IN_TRANSIT_INBOUND,
            title: 'Barang Dijemput Driver',
            description: 'Driver Agus Pratama melakukan pick-up dengan Truk Reefer B 9821 WMS.',
            actorName: 'Agus Pratama',
            actorRole: 'Driver',
            location: 'En-Route to Cakung Hub',
            timestamp: new Date('2026-08-01T07:45:00Z'),
          },
          {
            id: 'hist-03',
            status: GoodsStorageStatus.STORED,
            title: 'Barang Berhasil Disimpan di Gudang',
            description: 'Inspeksi suhu memenuhi syarat (-19.4 C). Ditempatkan di Slot COLD-A01.',
            actorName: 'Budi Santoso',
            actorRole: 'Admin',
            location: 'Slot COLD-A01, Gudang Cakung',
            timestamp: new Date('2026-08-01T09:00:00Z'),
          },
        ],
      },
    },
  });

  const goods02 = await prisma.goodsItem.create({
    data: {
      id: 'brg-002',
      barcode: 'BRG-2026-FROZEN-002',
      customerId: customer1.id,
      warehouseId: whCakung.id,
      slotId: slotC02.id,
      name: 'Australian Premium Wagyu Beef Ribeye',
      category: GoodsCategory.COLD_FOOD,
      description: 'Daging sapi beku premium potongan ribeye untuk restoran bintang 5.',
      lengthCm: 100.0,
      widthCm: 80.0,
      heightCm: 90.0,
      volumeM3: 0.72,
      weightKg: 380.0,
      quantity: 20,
      unit: 'Box Karton',
      requiresColdStorage: true,
      targetTempMin: -20.0,
      targetTempMax: -16.0,
      currentTemp: -18.2,
      storageStartDate: new Date('2026-08-05T11:00:00Z'),
      monthlyRentalFee: 1800000.0,
      status: GoodsStorageStatus.STORED,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      qrCodeData: 'WMS://ITEM/brg-002?code=BRG-2026-FROZEN-002',
      history: {
        create: [
          {
            id: 'hist-04',
            status: GoodsStorageStatus.STORED,
            title: 'Barang Disimpan di Cold Storage',
            description: 'Ditempatkan di Slot COLD-A02 dengan monitoring suhu otomatis.',
            actorName: 'Budi Santoso',
            actorRole: 'Admin',
            location: 'Slot COLD-A02',
            timestamp: new Date('2026-08-05T11:00:00Z'),
          },
        ],
      },
    },
  });

  const goods03 = await prisma.goodsItem.create({
    data: {
      id: 'brg-003',
      barcode: 'BRG-2026-FURN-003',
      customerId: customer1.id,
      warehouseId: whCakung.id,
      slotId: slotS01.id,
      name: 'Executive Ergonomic Office Mesh Chairs',
      category: GoodsCategory.FURNITURE,
      description: 'Kursi kantor ergonomis flatpack impor untuk proyek renovasi gedung kantor.',
      lengthCm: 150.0,
      widthCm: 120.0,
      heightCm: 180.0,
      volumeM3: 3.24,
      weightKg: 420.0,
      quantity: 25,
      unit: 'Flatpack Pallet',
      requiresColdStorage: false,
      storageStartDate: new Date('2026-07-20T10:00:00Z'),
      monthlyRentalFee: 3200000.0,
      status: GoodsStorageStatus.STORED,
      imageUrl: 'https://images.unsplash.com/photo-1580481077197-28562cb0d0e6?w=400&auto=format&fit=crop&q=80',
      qrCodeData: 'WMS://ITEM/brg-003?code=BRG-2026-FURN-003',
      history: {
        create: [
          {
            id: 'hist-05',
            status: GoodsStorageStatus.STORED,
            title: 'Disimpan di Rak Standar',
            description: 'Barang disimpan rapi pada RAK-F01 lantai 1.',
            actorName: 'Budi Santoso',
            actorRole: 'Admin',
            location: 'Slot RAK-F01',
            timestamp: new Date('2026-07-20T10:00:00Z'),
          },
        ],
      },
    },
  });

  const goods04 = await prisma.goodsItem.create({
    data: {
      id: 'brg-004',
      barcode: 'BRG-2026-FURN-004',
      customerId: customer1.id,
      warehouseId: whCakung.id,
      slotId: slotS03.id,
      name: 'Solid Teak Wood Dining Tables (Set of 6)',
      category: GoodsCategory.FURNITURE,
      description: 'Meja makan kayu jati solid dengan pelindung bubble wrap & kayu pallet.',
      lengthCm: 200.0,
      widthCm: 100.0,
      heightCm: 85.0,
      volumeM3: 1.7,
      weightKg: 350.0,
      quantity: 6,
      unit: 'Unit Pallet',
      requiresColdStorage: false,
      storageStartDate: new Date('2026-08-14T14:00:00Z'),
      monthlyRentalFee: 1700000.0,
      status: GoodsStorageStatus.PENDING_DELIVERY,
      imageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=400&auto=format&fit=crop&q=80',
      qrCodeData: 'WMS://ITEM/brg-004?code=BRG-2026-FURN-004',
      history: {
        create: [
          {
            id: 'hist-06',
            status: GoodsStorageStatus.PENDING_DELIVERY,
            title: 'Order Pengantaran Dibuat',
            description: 'Customer meminta pengantaran ke Jl. Senopati No. 18, Jakarta Selatan.',
            actorName: 'Siti Rahma',
            actorRole: 'Customer',
            location: 'Gudang Cakung',
            timestamp: new Date('2026-08-14T14:00:00Z'),
          },
        ],
      },
    },
  });

  const goodsBdg01 = await prisma.goodsItem.create({
    data: {
      id: 'brg-bdg-001',
      barcode: 'BRG-2026-FROZEN-005',
      customerId: customer1.id,
      warehouseId: whBandung.id,
      slotId: slotBdgC01.id,
      name: 'Susu Pasteurisasi Segar Lembang 1L',
      category: GoodsCategory.COLD_FOOD,
      description: 'Susu sapi murni pasteurisasi dingin dari peternakan Lembang.',
      lengthCm: 100.0,
      widthCm: 80.0,
      heightCm: 100.0,
      volumeM3: 0.8,
      weightKg: 200.0,
      quantity: 40,
      unit: 'Koli Karton',
      requiresColdStorage: true,
      targetTempMin: -22.0,
      targetTempMax: -18.0,
      currentTemp: -19.2,
      storageStartDate: new Date('2026-08-10T08:00:00Z'),
      monthlyRentalFee: 2000000.0,
      status: GoodsStorageStatus.STORED,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
      qrCodeData: 'WMS://ITEM/brg-bdg-001?code=BRG-2026-FROZEN-005',
      history: {
        create: [
          {
            id: 'hist-bdg-01',
            status: GoodsStorageStatus.STORED,
            title: 'Susu Pasteurisasi Masuk Cold Storage Gedebage',
            description: 'Barang diterima dan disimpan di Slot COLD-B01 dengan suhu -19.2 C.',
            actorName: 'Rian Nugraha',
            actorRole: 'Admin',
            location: 'Slot COLD-B01, Gedebage Hub',
            timestamp: new Date('2026-08-10T08:00:00Z'),
          },
        ],
      },
    },
  });

  const goodsBdg02 = await prisma.goodsItem.create({
    data: {
      id: 'brg-bdg-002',
      barcode: 'BRG-2026-TEXT-006',
      customerId: customer1.id,
      warehouseId: whBandung.id,
      slotId: slotBdgS01.id,
      name: 'Kain Tekstil Katun Premium Majalaya',
      category: GoodsCategory.TEXTILE,
      description: 'Gulungan kain katun ekspor produksi sentra tekstil Majalaya.',
      lengthCm: 150.0,
      widthCm: 100.0,
      heightCm: 100.0,
      volumeM3: 1.5,
      weightKg: 300.0,
      quantity: 15,
      unit: 'Roll Pallet',
      requiresColdStorage: false,
      storageStartDate: new Date('2026-08-12T10:00:00Z'),
      monthlyRentalFee: 1500000.0,
      status: GoodsStorageStatus.STORED,
      imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&auto=format&fit=crop&q=80',
      qrCodeData: 'WMS://ITEM/brg-bdg-002?code=BRG-2026-TEXT-006',
      history: {
        create: [
          {
            id: 'hist-bdg-02',
            status: GoodsStorageStatus.STORED,
            title: 'Tekstil Majalaya Disimpan di Rak Standar',
            description: 'Ditempatkan di Slot RAK-B01 Gudang Gedebage.',
            actorName: 'Rian Nugraha',
            actorRole: 'Admin',
            location: 'Slot RAK-B01',
            timestamp: new Date('2026-08-12T10:00:00Z'),
          },
        ],
      },
    },
  });

  // 8. Seed Delivery Orders
  console.log('📑 Seeding Delivery Orders & Order Items...');
  const order01 = await prisma.deliveryOrder.create({
    data: {
      id: 'ord-001',
      orderNumber: 'ORD-2026-0814-01',
      type: OrderType.DELIVERY,
      customerId: customer1.id,
      driverId: driver1.id,
      vehicleId: veh02.id,
      goodsSummary: 'Solid Teak Wood Dining Tables (Set of 6)',
      totalVolumeM3: 1.7,
      totalWeightKg: 350.0,
      requiresReefer: false,
      originAddress: 'Gudang Utama Cakung Logistics Hub, RAK-F03',
      originCity: 'Jakarta Timur',
      destinationAddress: 'Restoran Nusantara Rasa, Jl. Senopati No. 18',
      destinationCity: 'Jakarta Selatan',
      scheduledDate: new Date('2026-08-16'),
      scheduledTimeSlot: '14:00 - 17:00',
      status: OrderStatus.IN_TRANSIT,
      estimatedDurationMins: 45,
      distanceKm: 22.4,
      confirmedByCustomer: false,
      confirmedByDriver: true,
      confirmedByAdmin: true,
      orderItems: {
        create: [
          {
            id: 'item-ord-01',
            goodsId: goods04.id,
            quantity: 6,
          },
        ],
      },
    },
  });

  const order02 = await prisma.deliveryOrder.create({
    data: {
      id: 'ord-002',
      orderNumber: 'ORD-2026-0816-02',
      type: OrderType.PICKUP,
      customerId: customer1.id,
      goodsSummary: '30 Master Box Norwegian Salmon Fillet',
      totalVolumeM3: 0.96,
      totalWeightKg: 450.0,
      requiresReefer: true,
      originAddress: 'Pelabuhan Muara Baru Dermaga Timur No. 8',
      originCity: 'Jakarta Utara',
      destinationAddress: 'Gudang Utama Cakung Logistics Hub (Cold Zone)',
      destinationCity: 'Jakarta Timur',
      scheduledDate: new Date('2026-08-17'),
      scheduledTimeSlot: '08:00 - 11:00',
      status: OrderStatus.PENDING_ASSIGNMENT,
      estimatedDurationMins: 55,
      distanceKm: 28.0,
      confirmedByCustomer: false,
      confirmedByDriver: false,
      confirmedByAdmin: false,
      orderItems: {
        create: [
          {
            id: 'item-ord-02',
            goodsId: goods01.id,
            quantity: 30,
          },
        ],
      },
    },
  });

  const orderBdg01 = await prisma.deliveryOrder.create({
    data: {
      id: 'ord-bdg-001',
      orderNumber: 'ORD-2026-0818-BDG01',
      type: OrderType.DELIVERY,
      customerId: customer1.id,
      driverId: driver2.id,
      vehicleId: veh01.id,
      goodsSummary: '40 Koli Susu Pasteurisasi Lembang',
      totalVolumeM3: 0.8,
      totalWeightKg: 200.0,
      requiresReefer: true,
      originAddress: 'Gudang Distribusi Gedebage Cold Hub, COLD-B01',
      originCity: 'Bandung',
      destinationAddress: 'Supermarket Buah Segar Dago, Jl. Ir. H. Juanda No. 120',
      destinationCity: 'Bandung',
      scheduledDate: new Date('2026-08-18'),
      scheduledTimeSlot: '10:00 - 13:00',
      status: OrderStatus.IN_TRANSIT,
      estimatedDurationMins: 30,
      distanceKm: 14.5,
      confirmedByCustomer: false,
      confirmedByDriver: true,
      confirmedByAdmin: true,
      orderItems: {
        create: [
          {
            id: 'item-ord-bdg-01',
            goodsId: goodsBdg01.id,
            quantity: 40,
          },
        ],
      },
    },
  });

  // 9. Seed Invoices & Invoice Items
  console.log('💳 Seeding Invoices & Late Penalties...');
  const inv01 = await prisma.invoice.create({
    data: {
      id: 'inv-001',
      invoiceNumber: 'INV-2026-08-001',
      customerId: customer1.id,
      billingMonth: 'Agustus 2026',
      issueDate: new Date('2026-08-01T00:00:00Z'),
      dueDate: new Date('2026-08-10T23:59:59Z'),
      subtotal: 7440000.0,
      penaltyFee: 150000.0, // Late fee 5% applied
      totalAmount: 7590000.0,
      status: InvoiceStatus.OVERDUE,
      items: {
        create: [
          {
            id: 'inv-item-1',
            goodsId: goods01.id,
            description: 'Sewa Cold Storage (Slot COLD-A01) - 0.96 m3',
            goodsName: 'Norwegian Salmon Fillet Grade A',
            volumeM3: 0.96,
            ratePerM3: 2500000.0,
            subtotal: 2400000.0,
          },
          {
            id: 'inv-item-2',
            goodsId: goods02.id,
            description: 'Sewa Cold Storage (Slot COLD-A02) - 0.72 m3',
            goodsName: 'Australian Premium Wagyu Beef',
            volumeM3: 0.72,
            ratePerM3: 2500000.0,
            subtotal: 1800000.0,
          },
          {
            id: 'inv-item-3',
            goodsId: goods03.id,
            description: 'Sewa Rak Standar (Slot RAK-F01) - 3.24 m3',
            goodsName: 'Executive Ergonomic Office Chairs',
            volumeM3: 3.24,
            ratePerM3: 1000000.0,
            subtotal: 3240000.0,
          },
        ],
      },
    },
  });

  const inv02 = await prisma.invoice.create({
    data: {
      id: 'inv-002',
      invoiceNumber: 'INV-2026-07-089',
      customerId: customer1.id,
      billingMonth: 'Juli 2026',
      issueDate: new Date('2026-07-01T00:00:00Z'),
      dueDate: new Date('2026-07-10T23:59:59Z'),
      paidDate: new Date('2026-07-08T15:20:00Z'),
      subtotal: 3240000.0,
      penaltyFee: 0.0,
      totalAmount: 3240000.0,
      status: InvoiceStatus.PAID,
      paymentMethod: PaymentMethod.VIRTUAL_ACCOUNT,
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
      verifiedByAdminId: admin.id,
      verifiedAt: new Date('2026-07-08T16:00:00Z'),
      items: {
        create: [
          {
            id: 'inv-item-4',
            goodsId: goods03.id,
            description: 'Sewa Rak Standar (Slot RAK-F01) - Juli 2026',
            goodsName: 'Executive Ergonomic Office Chairs',
            volumeM3: 3.24,
            ratePerM3: 1000000.0,
            subtotal: 3240000.0,
          },
        ],
      },
    },
  });

  // 10. Seed Telemetry Logs
  console.log('🌡️ Seeding IoT Telemetry Logs...');
  await prisma.telemetryLog.createMany({
    data: [
      {
        slotId: slotC01.id,
        temperatureCelsius: -18.5,
        humidityPercent: 85.0,
        isAnomaly: false,
        recordedAt: new Date('2026-08-16T12:00:00Z'),
      },
      {
        slotId: slotC01.id,
        temperatureCelsius: -19.4,
        humidityPercent: 84.0,
        isAnomaly: false,
        recordedAt: new Date('2026-08-16T13:00:00Z'),
      },
      {
        slotId: slotBdgC01.id,
        temperatureCelsius: -19.2,
        humidityPercent: 82.0,
        isAnomaly: false,
        recordedAt: new Date('2026-08-16T14:00:00Z'),
      },
      {
        vehicleId: veh01.id,
        temperatureCelsius: -20.2,
        humidityPercent: 82.0,
        isAnomaly: false,
        recordedAt: new Date('2026-08-16T13:30:00Z'),
      },
    ],
  });

  // 11. Seed Notifications
  console.log('🔔 Seeding System Notifications...');
  await prisma.systemNotification.createMany({
    data: [
      {
        id: 'notif-001',
        recipientUserId: customer1.id,
        recipientRole: UserRole.CUSTOMER,
        title: 'Tagihan Sewa Melebihi Jatuh Tempo',
        message: 'Invoice INV-2026-08-001 sebesar Rp 7.590.000 telah melewati batas jatuh tempo (10 Ags 2026). Denda keterlambatan Rp 150.000 telah dicatat.',
        category: NotificationCategory.BILLING_DUE,
        relatedEntityId: inv01.id,
        relatedEntityType: RelatedEntityType.INVOICE,
        isRead: false,
        actionUrl: '/payments',
        createdAt: new Date('2026-08-11T00:00:00Z'),
      },
      {
        id: 'notif-002',
        recipientUserId: driver1.id,
        recipientRole: UserRole.DRIVER,
        title: 'Tugas Pengantaran Baru Ditugaskan',
        message: 'Anda ditugaskan untuk order ORD-2026-0814-01 menuju Jl. Senopati No. 18, Jakarta Selatan.',
        category: NotificationCategory.DRIVER_DISPATCHED,
        relatedEntityId: order01.id,
        relatedEntityType: RelatedEntityType.ORDER,
        isRead: false,
        actionUrl: '/tasks',
        createdAt: new Date('2026-08-16T13:00:00Z'),
      },
      {
        id: 'notif-003',
        recipientUserId: admin.id,
        recipientRole: UserRole.ADMIN,
        title: 'Permintaan Penjemputan Baru',
        message: 'Customer CV Fresh Frozen Nusantara mengajukan penjemputan 30 Box Salmon dari Pelabuhan Muara Baru.',
        category: NotificationCategory.GOODS_STORED,
        relatedEntityId: order02.id,
        relatedEntityType: RelatedEntityType.ORDER,
        isRead: true,
        actionUrl: '/logistics',
        createdAt: new Date('2026-08-16T10:05:00Z'),
      },
    ],
  });

  // 12. Seed Audit Logs
  console.log('🛡️ Seeding Audit Logs...');
  await prisma.auditLog.create({
    data: {
      id: 'audit-001',
      actorId: admin.id,
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'System',
      entityId: 'ROOT',
      newValues: { message: 'Database initialized with seed data' },
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ WMS Nusantara Database Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
