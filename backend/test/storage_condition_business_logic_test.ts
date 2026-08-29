import {
  PrismaClient,
  StorageZoneType,
  InvoiceStatus,
  GoodsCategory,
  GoodsStorageStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

async function runStorageConditionTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING STORAGE CONDITION & CAPACITY COMPATIBILITY VERIFICATION SUITE');
  console.log('========================================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] Test ${totalTests}: ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // 1. Authenticate Customer (haidar@gmail.com)
  console.log('\n--- PHASE 1: CUSTOMER SETUP & RENTAL CONFIGURATION ---');
  const customerEmail = 'haidar@gmail.com';
  const customer = await prisma.user.findUnique({ where: { email: customerEmail } });
  if (!customer) throw new Error(`Customer ${customerEmail} not found`);

  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerEmail, password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  assert(loginRes.status === 200 && Boolean(token), 'Customer login successful and JWT received');

  // Warehouses
  const whCold = await prisma.warehouse.findFirst({ where: { code: 'WH-BDG-01' } });
  const whDry = await prisma.warehouse.findFirst({ where: { code: 'WH-CKG-01' } });
  if (!whCold || !whDry) throw new Error('Warehouses WH-BDG-01 or WH-CKG-01 not found');

  // Ensure Customer has active rental invoices for WH-BDG-01 (Cold: 250 m³) and WH-CKG-01 (Standard: 300 m³)
  await prisma.invoiceItem.deleteMany({
    where: {
      invoice: {
        customerId: customer.id,
      },
      goodsName: { startsWith: 'TEST-RENTAL' },
    },
  });

  const testInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-TEST-RENTAL-${Date.now()}`,
      customerId: customer.id,
      billingMonth: 'August 2026',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 50000000,
      totalAmount: 50000000,
      status: InvoiceStatus.PAID,
      items: {
        create: [
          {
            description: `Warehouse Space Rental (Cold Storage Sub-zero (-18°C) - 250 m³ x 12 Months • ${whCold.name})`,
            goodsName: `TEST-RENTAL: ${whCold.code} - COLD_STORAGE`,
            volumeM3: 250.0,
            ratePerM3: 150000,
            subtotal: 37500000,
          },
          {
            description: `Warehouse Space Rental (Standard Dry Storage (24°C) - 300 m³ x 12 Months • ${whDry.name})`,
            goodsName: `TEST-RENTAL: ${whDry.code} - STANDARD`,
            volumeM3: 300.0,
            ratePerM3: 50000,
            subtotal: 15000000,
          },
        ],
      },
    },
  });

  console.log('   Rental agreements configured:');
  console.log(`   - ${whCold.name} (${whCold.code}): COLD_STORAGE 250 m³`);
  console.log(`   - ${whDry.name} (${whDry.code}): STANDARD 300 m³`);

  // Created test goods IDs to clean up later
  const testGoodsIds: string[] = [];

  // --------------------------------------------------------------------------
  // TEST 1: Bypass attempt: Register Standard DRY Goods to COLD Rental -> REJECT (400)
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 2: STORAGE CONDITION COMPATIBILITY ENFORCEMENT ---');
  const dryToColdRes = await fetch(`${API_URL}/goods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Dry Electronic Goods Attempt',
      category: GoodsCategory.GENERAL_ELECTRONICS,
      description: 'Attempting to store dry electronics in Cold Storage facility',
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      weightKg: 150,
      quantity: 10,
      unit: 'Boxes',
      requiresColdStorage: false, // DRY GOODS
      warehouseId: whCold.id,
    }),
  });
  const dryToColdData = await dryToColdRes.json();
  assert(
    dryToColdRes.status === 400 && dryToColdData.message?.includes('Cold Storage facility'),
    'Backend rejects DRY goods registration to COLD Storage warehouse rental (400 Bad Request)',
    dryToColdData.message,
  );

  // --------------------------------------------------------------------------
  // TEST 2: Bypass attempt: Register COLD Goods to DRY Rental -> REJECT (400)
  // --------------------------------------------------------------------------
  const coldToDryRes = await fetch(`${API_URL}/goods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Frozen Seafood Cold Goods Attempt',
      category: GoodsCategory.COLD_FOOD,
      description: 'Attempting to store frozen salmon in Standard Dry facility',
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      weightKg: 150,
      quantity: 10,
      unit: 'Boxes',
      requiresColdStorage: true, // COLD GOODS
      warehouseId: whDry.id,
    }),
  });
  const coldToDryData = await coldToDryRes.json();
  assert(
    coldToDryRes.status === 400 && coldToDryData.message?.includes('Standard Ambient facility'),
    'Backend rejects COLD goods registration to STANDARD Dry warehouse rental (400 Bad Request)',
    coldToDryData.message,
  );

  // --------------------------------------------------------------------------
  // TEST 3: Valid Registration: COLD Goods to COLD Rental -> SUCCESS (201/200)
  // --------------------------------------------------------------------------
  const validColdRes = await fetch(`${API_URL}/goods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Valid Premium Frozen Beef Ribeye A5',
      category: GoodsCategory.COLD_FOOD,
      description: 'Vacuum packed frozen beef stored at -18°C',
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      weightKg: 150,
      quantity: 10, // Total Vol: 0.6 m3, Total Wt: 150 kg
      unit: 'Boxes',
      requiresColdStorage: true,
      warehouseId: whCold.id,
    }),
  });
  const validColdData = await validColdRes.json();
  assert(
    (validColdRes.status === 200 || validColdRes.status === 201) && Boolean(validColdData.data?.id),
    'Backend accepts compatible COLD goods registration to COLD Storage warehouse',
    `SKU: ${validColdData.data?.barcode}, Stored in: ${whCold.name}`,
  );
  if (validColdData.data?.id) testGoodsIds.push(validColdData.data.id);

  // --------------------------------------------------------------------------
  // TEST 4: Valid Registration: DRY Goods to DRY Rental -> SUCCESS (201/200)
  // --------------------------------------------------------------------------
  const validDryRes = await fetch(`${API_URL}/goods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Valid Smart LED Monitor 4K',
      category: GoodsCategory.GENERAL_ELECTRONICS,
      description: 'Electronic hardware in retail packaging',
      lengthCm: 60,
      widthCm: 40,
      heightCm: 25,
      weightKg: 80,
      quantity: 10, // Total Vol: 0.6 m3, Total Wt: 80 kg
      unit: 'Boxes',
      requiresColdStorage: false,
      warehouseId: whDry.id,
    }),
  });
  const validDryData = await validDryRes.json();
  assert(
    (validDryRes.status === 200 || validDryRes.status === 201) && Boolean(validDryData.data?.id),
    'Backend accepts compatible DRY goods registration to STANDARD Dry warehouse',
    `SKU: ${validDryData.data?.barcode}, Stored in: ${whDry.name}`,
  );
  if (validDryData.data?.id) testGoodsIds.push(validDryData.data.id);

  // --------------------------------------------------------------------------
  // TEST 5: Capacity limit: Total Volume exceeds remaining rented volume -> REJECT (400)
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 3: DUAL CAPACITY LIMIT VALIDATION (VOLUME & WEIGHT) ---');
  const excessVolRes = await fetch(`${API_URL}/goods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Excess Volume Giant Cargo',
      category: GoodsCategory.COLD_FOOD,
      description: 'Extremely high volume cargo exceeding 250 m3 limit',
      lengthCm: 200,
      widthCm: 200,
      heightCm: 200, // 8 m3 per unit
      weightKg: 500, // 500 kg total
      quantity: 40, // 40 * 8 = 320 m3 (> 250 m3 total rental)
      unit: 'Crates',
      requiresColdStorage: true,
      warehouseId: whCold.id,
    }),
  });
  const excessVolData = await excessVolRes.json();
  assert(
    excessVolRes.status === 400 && excessVolData.message?.includes('volume capacity exceeded'),
    'Backend rejects registration when Volume exceeds rented capacity limit (400 Bad Request)',
    excessVolData.message,
  );

  // --------------------------------------------------------------------------
  // TEST 6: Capacity limit: Total Weight exceeds remaining rented weight -> REJECT (400)
  // --------------------------------------------------------------------------
  const excessWeightRes = await fetch(`${API_URL}/goods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Excess Weight Heavy Lead Cargo',
      category: GoodsCategory.COLD_FOOD,
      description: 'Extremely dense cargo exceeding weight limit (25,000 kg)',
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30, // 0.06 m3 per unit -> total 0.6 m3 (tiny volume)
      weightKg: 30000, // 30,000 kg (> 25,000 kg limit)
      quantity: 10,
      unit: 'Boxes',
      requiresColdStorage: true,
      warehouseId: whCold.id,
    }),
  });
  const excessWeightData = await excessWeightRes.json();
  assert(
    excessWeightRes.status === 400 &&
      excessWeightData.message?.includes('weight capacity exceeded'),
    'Backend rejects registration when Weight exceeds rented limit even if Volume is tiny (400 Bad Request)',
    excessWeightData.message,
  );

  // --------------------------------------------------------------------------
  // TEST 7: Independent Validation: Volume valid (10 m3) but Weight invalid (35,000 kg) -> REJECT
  // --------------------------------------------------------------------------
  const volOkWeightBadRes = await fetch(`${API_URL}/goods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'High Density Gold Bars Cargo',
      category: GoodsCategory.COLD_FOOD,
      description: 'Small volume 10 m3 with excessive 35,000 kg weight',
      lengthCm: 100,
      widthCm: 100,
      heightCm: 100, // 1 m3 per unit * 10 = 10 m3
      weightKg: 35000, // 35,000 kg
      quantity: 10,
      unit: 'Crates',
      requiresColdStorage: true,
      warehouseId: whCold.id,
    }),
  });
  assert(
    volOkWeightBadRes.status === 400,
    'Independent check: Volume OK (10 m3) but Weight Invalid (35,000 kg) is rejected (400)',
  );

  // --------------------------------------------------------------------------
  // TEST 8: Independent Validation: Weight valid (100 kg) but Volume invalid (400 m3) -> REJECT
  // --------------------------------------------------------------------------
  const weightOkVolBadRes = await fetch(`${API_URL}/goods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Feather Light Giant Balloon Cargo',
      category: GoodsCategory.COLD_FOOD,
      description: 'Extremely lightweight 100 kg with huge volume 400 m3',
      lengthCm: 200,
      widthCm: 200,
      heightCm: 200, // 8 m3 per unit * 50 = 400 m3
      weightKg: 100, // 100 kg total
      quantity: 50,
      unit: 'Units',
      requiresColdStorage: true,
      warehouseId: whCold.id,
    }),
  });
  assert(
    weightOkVolBadRes.status === 400,
    'Independent check: Weight OK (100 kg) but Volume Invalid (400 m3) is rejected (400)',
  );

  // --------------------------------------------------------------------------
  // CLEANUP TEST DATA
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 4: CLEANUP TEST DATA ---');
  if (testGoodsIds.length > 0) {
    await prisma.goodsMutation.deleteMany({ where: { goodsId: { in: testGoodsIds } } });
    await prisma.systemNotification.deleteMany({
      where: { relatedEntityId: { in: testGoodsIds } },
    });
    await prisma.goodsItem.deleteMany({ where: { id: { in: testGoodsIds } } });
  }

  await prisma.invoiceItem.deleteMany({ where: { invoiceId: testInvoice.id } });
  await prisma.invoice.delete({ where: { id: testInvoice.id } });
  console.log('   Test goods and temporary test invoice cleaned up cleanly.');

  console.log('========================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} STORAGE CONDITION & CAPACITY TESTS PASSED!`);
  console.log('========================================================================');
}

runStorageConditionTests()
  .catch((err) => {
    console.error('Storage Condition Tests Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
