import { PrismaClient, GoodsCategory, GoodsStorageStatus, UserRole } from '@prisma/client';
import { GoodsService } from '../src/modules/goods/goods.service';
import { WarehouseService } from '../src/modules/warehouse/warehouse.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { AuthenticatedUser } from '../src/modules/auth/interfaces/jwt-payload.interface';

import { EventsService } from '../src/modules/events/events.service';

const prisma = new PrismaClient();

async function runTests() {
  console.log('================================================================');
  console.log('   STARTING 7 MANDATORY REAL-DATABASE CAPACITY ACCOUNTING TESTS ');
  console.log('================================================================\n');

  const eventsService = new EventsService();
  const notificationsService = new NotificationsService(prisma as any, eventsService);
  const goodsService = new GoodsService(prisma as any, notificationsService, eventsService);
  const warehouseService = new WarehouseService(prisma as any, eventsService);

  // Setup Admin & Customer context
  const adminUserRecord = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (!adminUserRecord) {
    throw new Error('Admin user not found in DB');
  }

  const adminUser: AuthenticatedUser = {
    id: adminUserRecord.id,
    email: adminUserRecord.email,
    role: UserRole.ADMIN,
    name: adminUserRecord.name,
    phone: adminUserRecord.phone,
    status: adminUserRecord.status,
  };

  const customerUser = await prisma.user.findFirst({
    where: { role: UserRole.CUSTOMER },
  });

  if (!customerUser) {
    throw new Error('Customer user not found in DB');
  }

  const customerAuth: AuthenticatedUser = {
    id: customerUser.id,
    email: customerUser.email,
    role: UserRole.CUSTOMER,
    name: customerUser.name,
    phone: customerUser.phone,
    status: customerUser.status,
  };

  const warehouse = await prisma.warehouse.findUnique({
    where: { code: 'WH-CKG-01' },
    include: { slots: true },
  });

  if (!warehouse) throw new Error('Warehouse WH-CKG-01 not found');

  const slotF01 = warehouse.slots.find((s: any) => s.code === 'RAK-F01')!;
  const slotF02 = warehouse.slots.find((s: any) => s.code === 'RAK-F02')!;

  console.log(`Using Warehouse: ${warehouse.name} (${warehouse.code})`);
  console.log(`Slot F01: ${slotF01.code} (Cap: ${slotF01.capacityM3} m³)`);
  console.log(`Slot F02: ${slotF02.code} (Cap: ${slotF02.capacityM3} m³)\n`);

  // Clean up any old test items first (keep non-test ones)
  await prisma.goodsItem.deleteMany({
    where: { barcode: { startsWith: 'TEST-CAP-' } },
  });
  await goodsService.reconcileAllCapacity();

  // -------------------------------------------------------------
  // TEST 1 — Empty Rack
  // -------------------------------------------------------------
  console.log('--- TEST 1: Empty Rack Verification (RAK-F02) ---');
  let whDetail = await warehouseService.findById(warehouse.id);
  let slotF02Data = whDetail.slots.find((s: any) => s.id === slotF02.id)!;

  console.log(`Slot F02 Used: ${slotF02Data.usedM3} m³ / ${slotF02Data.capacityM3} m³`);
  console.log(`Slot F02 Status: ${slotF02Data.status}`);
  if (slotF02Data.usedM3 !== 0 || slotF02Data.status !== 'AVAILABLE') {
    throw new Error(`TEST 1 Failed: Expected Used=0, Status=AVAILABLE, got Used=${slotF02Data.usedM3}, Status=${slotF02Data.status}`);
  }
  console.log('✅ TEST 1 PASSED: Empty rack correctly reports 0 m³ and AVAILABLE status.\n');

  // -------------------------------------------------------------
  // TEST 2 — Put Away 6 m³
  // -------------------------------------------------------------
  console.log('--- TEST 2: Put Away 6 m³ Item into RAK-F02 ---');
  // Dimensions: 200 x 150 x 200 cm = 6,000,000 cm3 = 6 m3
  const item1 = await prisma.goodsItem.create({
    data: {
      barcode: 'TEST-CAP-001',
      customerId: customerAuth.id,
      warehouseId: warehouse.id,
      name: 'Test Pallet 6m3 Item',
      category: GoodsCategory.FURNITURE,
      description: 'Test Goods 6m3',
      lengthCm: 200,
      widthCm: 150,
      heightCm: 200,
      volumeM3: 6.0,
      weightKg: 500,
      quantity: 1,
      unit: 'Pallet',
      storageStartDate: new Date(),
      monthlyRentalFee: 9000000,
      status: GoodsStorageStatus.INSPECTING,
      qrCodeData: 'WMS://TEST-001',
    },
  });

  await goodsService.updateStatus(
    item1.id,
    { status: GoodsStorageStatus.STORED, slotId: slotF02.id, note: 'Put away 6 m3 test item' },
    adminUser,
  );

  whDetail = await warehouseService.findById(warehouse.id);
  slotF02Data = whDetail.slots.find((s: any) => s.id === slotF02.id)!;
  console.log(`Slot F02 Used: ${slotF02Data.usedM3} / ${slotF02Data.capacityM3} m³`);
  console.log(`Slot F02 Status: ${slotF02Data.status}`);
  console.log(`Warehouse Used Capacity: ${whDetail.usedCapacityM3} / ${whDetail.totalCapacityM3} m³`);

  if (slotF02Data.usedM3 !== 6.0 || slotF02Data.status !== 'OCCUPIED') {
    throw new Error(`TEST 2 Failed: Expected slot used=6.0 m3, OCCUPIED. Got used=${slotF02Data.usedM3}, status=${slotF02Data.status}`);
  }
  console.log('✅ TEST 2 PASSED: 6 m³ put-away correctly updated slot and warehouse.\n');

  // -------------------------------------------------------------
  // TEST 3 — Put Away Additional 50 m³
  // -------------------------------------------------------------
  console.log('--- TEST 3: Put Away Additional 50 m³ Item into RAK-F02 ---');
  // Dimensions: 50 m3 total
  const item2 = await prisma.goodsItem.create({
    data: {
      barcode: 'TEST-CAP-002',
      customerId: customerAuth.id,
      warehouseId: warehouse.id,
      name: 'Test Bulk Cargo 50m3',
      category: GoodsCategory.TEXTILE,
      description: 'Test Goods 50m3',
      lengthCm: 250,
      widthCm: 200,
      heightCm: 1000,
      volumeM3: 50.0,
      weightKg: 2000,
      quantity: 1,
      unit: 'Crate',
      storageStartDate: new Date(),
      monthlyRentalFee: 75000000,
      status: GoodsStorageStatus.INSPECTING,
      qrCodeData: 'WMS://TEST-002',
    },
  });

  await goodsService.updateStatus(
    item2.id,
    { status: GoodsStorageStatus.STORED, slotId: slotF02.id, note: 'Put away 50 m3 test item' },
    adminUser,
  );

  whDetail = await warehouseService.findById(warehouse.id);
  slotF02Data = whDetail.slots.find((s: any) => s.id === slotF02.id)!;
  console.log(`Slot F02 Used: ${slotF02Data.usedM3} / ${slotF02Data.capacityM3} m³`);
  console.log(`Slot F02 Available: ${slotF02Data.capacityM3 - slotF02Data.usedM3} m³`);

  if (slotF02Data.usedM3 !== 56.0) {
    throw new Error(`TEST 3 Failed: Expected slot used=56.0 m3, got ${slotF02Data.usedM3}`);
  }
  console.log('✅ TEST 3 PASSED: Additional 50 m³ successfully accumulated to 56 m³.\n');

  // -------------------------------------------------------------
  // TEST 4 — Intra-Warehouse Rack Transfer (6 m³ from F02 -> F03)
  // -------------------------------------------------------------
  const slotF03 = warehouse.slots.find((s: any) => s.code === 'RAK-F03')!;
  console.log(`--- TEST 4: Transfer 6 m³ Item (item1) from RAK-F02 to RAK-F03 ---`);
  const initialWhUsed = whDetail.usedCapacityM3;

  await goodsService.transferSlot(
    item1.id,
    { targetSlotId: slotF03.id, reason: 'Load balancing test transfer', note: 'Moving 6m3 to F03' },
    adminUser,
  );

  whDetail = await warehouseService.findById(warehouse.id);
  slotF02Data = whDetail.slots.find((s: any) => s.id === slotF02.id)!;
  const slotF03Data = whDetail.slots.find((s: any) => s.id === slotF03.id)!;

  console.log(`Slot F02 Used: ${slotF02Data.usedM3} / ${slotF02Data.capacityM3} m³ (Expected: 50 m³)`);
  console.log(`Slot F03 Used: ${slotF03Data.usedM3} / ${slotF03Data.capacityM3} m³ (Expected: 6 m³)`);
  console.log(`Warehouse Total Used: ${whDetail.usedCapacityM3} m³ (Expected: ${initialWhUsed} m³ - No Double Counting)`);

  if (slotF02Data.usedM3 !== 50.0 || slotF03Data.usedM3 !== 6.0 || whDetail.usedCapacityM3 !== initialWhUsed) {
    throw new Error(`TEST 4 Failed: Transfer calculation mismatch.`);
  }
  console.log('✅ TEST 4 PASSED: Transfer decremented source, incremented target, and kept warehouse total exact without double counting.\n');

  // -------------------------------------------------------------
  // TEST 5 — Full Rack (Fill F03 to 200 m³)
  // -------------------------------------------------------------
  console.log('--- TEST 5: Full Rack Capacity (Fill F03 from 6 m³ to 200 m³ with 194 m³) ---');
  const item3 = await prisma.goodsItem.create({
    data: {
      barcode: 'TEST-CAP-003',
      customerId: customerAuth.id,
      warehouseId: warehouse.id,
      name: 'Test Full Rack Filler 194m3',
      category: GoodsCategory.GENERAL_ELECTRONICS,
      description: 'Test Goods 194m3',
      lengthCm: 1000,
      widthCm: 1000,
      heightCm: 1940,
      volumeM3: 194.0,
      weightKg: 5000,
      quantity: 1,
      unit: 'Crate',
      storageStartDate: new Date(),
      monthlyRentalFee: 291000000,
      status: GoodsStorageStatus.INSPECTING,
      qrCodeData: 'WMS://TEST-003',
    },
  });

  await goodsService.updateStatus(
    item3.id,
    { status: GoodsStorageStatus.STORED, slotId: slotF03.id, note: 'Fill F03 completely' },
    adminUser,
  );

  whDetail = await warehouseService.findById(warehouse.id);
  const fullSlotF03 = whDetail.slots.find((s: any) => s.id === slotF03.id)!;
  console.log(`Slot F03 Used: ${fullSlotF03.usedM3} / ${fullSlotF03.capacityM3} m³`);
  console.log(`Slot F03 Status: ${fullSlotF03.status}`);

  if (fullSlotF03.usedM3 !== 200.0) {
    throw new Error(`TEST 5 Failed: Expected 200 m3 used, got ${fullSlotF03.usedM3}`);
  }
  console.log('✅ TEST 5 PASSED: Full rack reports 200 / 200 m³ (100% Occupancy).\n');

  // -------------------------------------------------------------
  // TEST 6 — Over Capacity Validation (Attempt to store 6 m³ in full F03)
  // -------------------------------------------------------------
  console.log('--- TEST 6: Over Capacity Validation (Reject Put-Away when Rack is Full) ---');
  const item4 = await prisma.goodsItem.create({
    data: {
      barcode: 'TEST-CAP-004',
      customerId: customerAuth.id,
      warehouseId: warehouse.id,
      name: 'Over Capacity Item 6m3',
      category: GoodsCategory.FURNITURE,
      description: 'Should fail',
      lengthCm: 200,
      widthCm: 150,
      heightCm: 200,
      volumeM3: 6.0,
      weightKg: 500,
      quantity: 1,
      unit: 'Pallet',
      storageStartDate: new Date(),
      monthlyRentalFee: 9000000,
      status: GoodsStorageStatus.INSPECTING,
      qrCodeData: 'WMS://TEST-004',
    },
  });

  let overCapacityRejected = false;
  try {
    await goodsService.updateStatus(
      item4.id,
      { status: GoodsStorageStatus.STORED, slotId: slotF03.id, note: 'Attempt over capacity' },
      adminUser,
    );
  } catch (err: any) {
    overCapacityRejected = true;
    console.log(`Caught Expected Error: "${err.message}"`);
  }

  if (!overCapacityRejected) {
    throw new Error('TEST 6 Failed: Over capacity transaction was not rejected!');
  }
  console.log('✅ TEST 6 PASSED: Backend correctly prevented over-capacity put-away.\n');

  // -------------------------------------------------------------
  // TEST 7 — Multi-Goods Sum Validation
  // -------------------------------------------------------------
  console.log('--- TEST 7: Multi-Goods Sum Accounting Validation ---');
  // Slot F01 already has 6 m3 (Beras Premium BOSSS)
  // Add Goods A (10 m3) and Goods B (15 m3)
  const itemA = await prisma.goodsItem.create({
    data: {
      barcode: 'TEST-CAP-MULTI-A',
      customerId: customerAuth.id,
      warehouseId: warehouse.id,
      name: 'Multi-Goods A (10m3)',
      category: GoodsCategory.FURNITURE,
      description: 'Multi test A',
      lengthCm: 200,
      widthCm: 250,
      heightCm: 200,
      volumeM3: 10.0,
      weightKg: 800,
      quantity: 1,
      unit: 'Pallet',
      storageStartDate: new Date(),
      monthlyRentalFee: 15000000,
      status: GoodsStorageStatus.INSPECTING,
      qrCodeData: 'WMS://TEST-MULTI-A',
    },
  });

  const itemB = await prisma.goodsItem.create({
    data: {
      barcode: 'TEST-CAP-MULTI-B',
      customerId: customerAuth.id,
      warehouseId: warehouse.id,
      name: 'Multi-Goods B (15m3)',
      category: GoodsCategory.FURNITURE,
      description: 'Multi test B',
      lengthCm: 300,
      widthCm: 250,
      heightCm: 200,
      volumeM3: 15.0,
      weightKg: 1200,
      quantity: 1,
      unit: 'Pallet',
      storageStartDate: new Date(),
      monthlyRentalFee: 22500000,
      status: GoodsStorageStatus.INSPECTING,
      qrCodeData: 'WMS://TEST-MULTI-B',
    },
  });

  await goodsService.updateStatus(itemA.id, { status: GoodsStorageStatus.STORED, slotId: slotF01.id }, adminUser);
  await goodsService.updateStatus(itemB.id, { status: GoodsStorageStatus.STORED, slotId: slotF01.id }, adminUser);

  whDetail = await warehouseService.findById(warehouse.id);
  const slotF01Data = whDetail.slots.find((s: any) => s.id === slotF01.id)!;

  // 6 (Beras) + 10 (Item A) + 15 (Item B) = 31 m3
  console.log(`Slot F01 Stored Items Count: ${slotF01Data.storedGoods?.length || 0}`);
  console.log(`Slot F01 Total Used Volume: ${slotF01Data.usedM3} m³ (Expected: 31 m³)`);

  if (slotF01Data.usedM3 !== 31.0) {
    throw new Error(`TEST 7 Failed: Expected 31.0 m3, got ${slotF01Data.usedM3}`);
  }
  console.log('✅ TEST 7 PASSED: Multi-goods accounting accurately aggregated to 31 m³ without drift or double counting.\n');

  // Clean up all temporary test items created for the tests
  console.log('--- Cleaning Up Temporary Test Records ---');
  await prisma.goodsItem.deleteMany({
    where: { barcode: { startsWith: 'TEST-CAP-' } },
  });
  await goodsService.reconcileAllCapacity();

  // Final sanity check
  whDetail = await warehouseService.findById(warehouse.id);
  const finalF01 = whDetail.slots.find((s: any) => s.id === slotF01.id)!;
  console.log(`Final State Slot F01 (Beras Premium BOSSS only): ${finalF01.usedM3} / ${finalF01.capacityM3} m³`);
  console.log(`Final Warehouse Used Capacity: ${whDetail.usedCapacityM3} / ${whDetail.totalCapacityM3} m³`);

  console.log('\n================================================================');
  console.log('   🎉 ALL 7 CAPACITY ACCOUNTING TESTS PASSED WITH 100% SUCCESS  ');
  console.log('================================================================');
}

runTests()
  .catch((e) => {
    console.error('TEST SUITE FAILED:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
