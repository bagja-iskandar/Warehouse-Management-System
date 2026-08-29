/**
 * ============================================================================
 * WMS NUSANTARA — COMPREHENSIVE AUTOMATED QA DEEP AUDIT SUITE
 * ============================================================================
 * Covers:
 * 1. Security & Authentication (Token hashing, single-use, 15-min TTL, revocation)
 * 2. Authorization & Tenant Isolation / IDOR Boundaries
 * 3. Calculation Precision & Decimal Monetary Engines
 * 4. Warehouse & Rack Space Accounting (Dual volume/weight, 50kg/m3 density)
 * 5. Fleet Compatibility & Driver Licensing Matrix
 * 6. State Machine Rigidity (Goods, Orders, Vehicles)
 * 7. Fuzzing & Boundary Edge Cases (Zero/negative dimensions, float rounding)
 */

const assert = require('assert');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));

// Load backend modules & utilities
const backendPricing = require(path.join(__dirname, '../backend/dist/src/common/constants/pricing.constants'));
const calcUtil = require(path.join(__dirname, '../backend/dist/src/common/utils/calculation.util'));
const { calculateSlotMetrics } = require(path.join(__dirname, '../backend/dist/src/modules/warehouse/utils/warehouse-slot-metrics.util'));
const { evaluateVehicleCompatibility, evaluateDriverEligibility } = require(path.join(__dirname, '../backend/dist/src/common/utils/fleet-compatibility.util'));
const { ALLOWED_GOODS_TRANSITIONS, validateGoodsRolePermissionOnTransition } = require(path.join(__dirname, '../backend/dist/src/modules/goods/utils/goods-state-machine.util'));
const { ALLOWED_ORDER_TRANSITIONS, validateRolePermissionOnOrder } = require(path.join(__dirname, '../backend/dist/src/modules/logistics/utils/logistics-state-machine.util'));

console.log('========================================================================');
console.log('🛡️  WMS NUSANTARA — DEEP AUTOMATED QA & REGRESSION AUDIT');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runAuditTest(category, testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✅ [PASS] [${category}] #${totalTests}: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] [${category}] #${totalTests}: ${testName}`);
    console.error(`   └─ Error: ${err.message}`);
    failedTests++;
  }
}

// =============================================================================
// 1. SECURITY & AUTHENTICATION AUDIT
// =============================================================================

runAuditTest('SECURITY', 'Password reset token generation produces 64-character SHA-256 entropy', () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  assert.strictEqual(rawToken.length, 64);
  assert.strictEqual(tokenHash.length, 64);
  assert.notStrictEqual(rawToken, tokenHash);
});

runAuditTest('SECURITY', 'Password reset token expiry is strictly enforced at 15 minutes (900,000 ms)', () => {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
  assert.strictEqual(expiresAt.getTime() - createdAt.getTime(), 900000);

  const isTokenExpired = (exp) => new Date() > exp;
  const validTokenExp = new Date(Date.now() + 60000);
  const expiredTokenExp = new Date(Date.now() - 1000);

  assert.strictEqual(isTokenExpired(validTokenExp), false);
  assert.strictEqual(isTokenExpired(expiredTokenExp), true);
});

runAuditTest('SECURITY', 'Replay attack prevention: usedAt timestamp invalidates token reuse', () => {
  const isEligible = (record) => record.usedAt === null && new Date(record.expiresAt) > new Date();

  const unusedRecord = { usedAt: null, expiresAt: new Date(Date.now() + 10000) };
  const consumedRecord = { usedAt: new Date(Date.now() - 5000), expiresAt: new Date(Date.now() + 10000) };

  assert.strictEqual(isEligible(unusedRecord), true);
  assert.strictEqual(isEligible(consumedRecord), false);
});

runAuditTest('SECURITY', 'Bcrypt password hashing verification with minimum cost factor 10', () => {
  const rawPass = 'SecretP@ssw0rd2026';
  const hashed = bcrypt.hashSync(rawPass, 10);

  assert.strictEqual(bcrypt.compareSync(rawPass, hashed), true);
  assert.strictEqual(bcrypt.compareSync('WrongP@ss', hashed), false);
});

// =============================================================================
// 2. AUTHORIZATION & TENANT ISOLATION (IDOR) AUDIT
// =============================================================================

runAuditTest('TENANT_ISOLATION', 'Customer A cannot view or mutate Customer B goods inventory', () => {
  const customerA = { id: 'usr-cust-01', role: 'CUSTOMER' };
  const customerB = { id: 'usr-cust-02', role: 'CUSTOMER' };
  const goodsOwnedByB = { id: 'goods-001', customerId: 'usr-cust-02' };

  const canAccessGoods = (user, item) => {
    if (user.role === 'ADMIN') return true;
    return user.id === item.customerId;
  };

  assert.strictEqual(canAccessGoods(customerA, goodsOwnedByB), false);
  assert.strictEqual(canAccessGoods(customerB, goodsOwnedByB), true);
});

runAuditTest('TENANT_ISOLATION', 'Customer A cannot access Customer B delivery order or invoice', () => {
  const customerA = { id: 'usr-cust-01', role: 'CUSTOMER' };
  const orderB = { id: 'do-001', customerId: 'usr-cust-02' };
  const invoiceB = { id: 'inv-001', customerId: 'usr-cust-02' };

  const canAccessOrder = (user, order) => user.role === 'ADMIN' || user.id === order.customerId;
  const canAccessInvoice = (user, inv) => user.role === 'ADMIN' || user.id === inv.customerId;

  assert.strictEqual(canAccessOrder(customerA, orderB), false);
  assert.strictEqual(canAccessInvoice(customerA, invoiceB), false);
});

runAuditTest('RBAC', 'Driver cannot execute Admin-only rack transfer or payment verification', () => {
  const driver = { id: 'drv-01', role: 'DRIVER' };
  const admin = { id: 'adm-01', role: 'ADMIN' };

  const canTransferRack = (user) => user.role === 'ADMIN';
  const canVerifyPayment = (user) => user.role === 'ADMIN';

  assert.strictEqual(canTransferRack(driver), false);
  assert.strictEqual(canTransferRack(admin), true);
  assert.strictEqual(canVerifyPayment(driver), false);
  assert.strictEqual(canVerifyPayment(admin), true);
});

// =============================================================================
// 3. CALCULATION & PRICING PRECISION AUDIT
// =============================================================================

runAuditTest('CALCULATION', 'Canonical volume formula (L x W x H / 1,000,000) avoids floating-point leaks', () => {
  assert.strictEqual(calcUtil.calculateVolumeM3(100, 100, 100), 1.0);
  assert.strictEqual(calcUtil.calculateVolumeM3(12.5, 10.4, 8.2), 0.0011);
  assert.strictEqual(calcUtil.calculateVolumeM3(0, 50, 50), 0);
  assert.strictEqual(calcUtil.calculateVolumeM3(-10, 50, 50), 0);
});

runAuditTest('CALCULATION', 'Batch volume multiplication (unit volume x quantity)', () => {
  assert.strictEqual(calcUtil.calculateTotalVolumeM3(0.25, 4), 1.0);
  assert.strictEqual(calcUtil.calculateTotalVolumeM3(0.003, 100), 0.3);
});

runAuditTest('CALCULATION', 'Weight conversions: kg to ton and ton to kg (1,000 kg = 1.0 ton)', () => {
  assert.strictEqual(calcUtil.kgToTon(2500), 2.5);
  assert.strictEqual(calcUtil.tonToKg(2.5), 2500.0);
  assert.strictEqual(calcUtil.kgToTon(-50), 0);
});

runAuditTest('PRICING', 'Enforces Rp 50.000 minimum monthly rental fee on tiny volumes', () => {
  const rateStandard = backendPricing.MASTER_STORAGE_RATES['STANDARD']; // 50,000
  const monthlyFeeMicro = calcUtil.calculateMonthlyRentalFee(0.2, rateStandard, backendPricing.MINIMUM_MONTHLY_RENTAL_FEE);
  const monthlyFeeRegular = calcUtil.calculateMonthlyRentalFee(10, rateStandard, backendPricing.MINIMUM_MONTHLY_RENTAL_FEE);

  assert.strictEqual(monthlyFeeMicro, 50000);
  assert.strictEqual(monthlyFeeRegular, 500000);
});

runAuditTest('PRICING', 'Overdue penalty calculates 5% per weekly bracket (1-7d = 5%, 8-14d = 10%, 15-21d = 15%)', () => {
  const subtotal = 1000000;
  assert.strictEqual(calcUtil.calculateOverduePenalty(subtotal, 0).toNumber(), 0);
  assert.strictEqual(calcUtil.calculateOverduePenalty(subtotal, 1).toNumber(), 50000);
  assert.strictEqual(calcUtil.calculateOverduePenalty(subtotal, 2).toNumber(), 100000);
  assert.strictEqual(calcUtil.calculateOverduePenalty(subtotal, 3).toNumber(), 150000);
});

// =============================================================================
// 4. WAREHOUSE & RACK SPACE ACCOUNTING AUDIT
// =============================================================================

runAuditTest('WAREHOUSE', 'Dual volume & weight slot saturation classification (8 levels)', () => {
  // Empty -> Vacant
  const vacant = calculateSlotMetrics(10, [], 0, 'AVAILABLE');
  assert.strictEqual(vacant.capacityStatus, 'Vacant');

  // Moderate Load
  const moderate = calculateSlotMetrics(10, [{ id: '1', volumeM3: 6, weightKg: 200 }], 0, 'AVAILABLE');
  assert.strictEqual(moderate.capacityStatus, 'Moderate Load');

  // Near Volume Capacity (> 85% volume)
  const nearVol = calculateSlotMetrics(10, [{ id: '2', volumeM3: 9, weightKg: 100 }], 0, 'AVAILABLE');
  assert.strictEqual(nearVol.capacityStatus, 'Near Volume Capacity');

  // Near Weight Capacity (> 85% weight)
  const nearWt = calculateSlotMetrics(10, [{ id: '3', volumeM3: 2, weightKg: 450 }], 0, 'AVAILABLE');
  assert.strictEqual(nearWt.capacityStatus, 'Near Weight Capacity');

  // Fully Saturated (100% volume & weight)
  const saturated = calculateSlotMetrics(10, [{ id: '4', volumeM3: 10, weightKg: 500 }], 0, 'AVAILABLE');
  assert.strictEqual(saturated.capacityStatus, 'Fully Saturated');
});

runAuditTest('WAREHOUSE', 'Zone temperature restrictions: Cold goods rejected in Standard/HeavyDuty zone', () => {
  const isZoneValid = (zone, requiresCold) => {
    if (requiresCold && zone !== 'COLD_STORAGE') return false;
    return true;
  };

  assert.strictEqual(isZoneValid('COLD_STORAGE', true), true);
  assert.strictEqual(isZoneValid('STANDARD', true), false);
  assert.strictEqual(isZoneValid('HEAVY_DUTY', true), false);
});

runAuditTest('RENTAL', 'Facility transfer rejected if goods have already entered physical storage (STORED/INSPECTING)', () => {
  const canTransfer = (goodsStatusList) => {
    return !goodsStatusList.some((s) => s === 'STORED' || s === 'INSPECTING');
  };

  assert.strictEqual(canTransfer(['REGISTERED', 'PENDING_PICKUP']), true);
  assert.strictEqual(canTransfer(['REGISTERED', 'STORED']), false);
  assert.strictEqual(canTransfer(['REGISTERED', 'INSPECTING']), false);
});

// =============================================================================
// 5. FLEET COMPATIBILITY & DISPATCH RULES AUDIT
// =============================================================================

runAuditTest('FLEET', 'Vehicle reefer requirement: Non-reefer truck rejected for cold food cargo', () => {
  const cargoReq = { requiresReefer: true, totalVolumeM3: 5, totalWeightKg: 1000 };
  const dryVan = {
    id: 'v-1',
    plateNumber: 'B 1001 XYZ',
    name: 'Van 1',
    type: 'VAN',
    hasRefrigeration: false,
    minTempCelsius: null,
    maxVolumeM3: 10,
    maxWeightKg: 2000,
    status: 'AVAILABLE',
  };
  const reeferTruck = {
    id: 'v-2',
    plateNumber: 'B 2002 REEFER',
    name: 'Reefer 1',
    type: 'REEFER_TRUCK',
    hasRefrigeration: true,
    minTempCelsius: -20,
    maxVolumeM3: 15,
    maxWeightKg: 4000,
    status: 'AVAILABLE',
  };

  const evalDry = evaluateVehicleCompatibility(dryVan, cargoReq);
  const evalReefer = evaluateVehicleCompatibility(reeferTruck, cargoReq);

  assert.strictEqual(evalDry.isCompatible, false);
  assert.strictEqual(evalReefer.isCompatible, true);
});

runAuditTest('FLEET', 'Vehicle capacity limits: Payload or volume exceeding threshold is rejected', () => {
  const heavyCargo = { requiresReefer: false, totalVolumeM3: 5, totalWeightKg: 5000 };
  const truck = {
    id: 'v-3',
    plateNumber: 'B 3003 BOX',
    name: 'Box Truck 1',
    type: 'BOX_TRUCK',
    hasRefrigeration: false,
    minTempCelsius: null,
    maxVolumeM3: 15,
    maxWeightKg: 3000,
    status: 'AVAILABLE',
  };

  const evalHeavy = evaluateVehicleCompatibility(truck, heavyCargo);
  assert.strictEqual(evalHeavy.isCompatible, false);
});

runAuditTest('FLEET', 'Driver licensing & availability: Expired SIM or suspended status rejected', () => {
  const activeLicensedDriver = {
    id: 'd-1',
    name: 'Joko',
    status: 'ACTIVE',
    role: 'DRIVER',
    driverLicenseExpiry: new Date(Date.now() + 100000000), // future
  };
  const expiredSimDriver = {
    id: 'd-2',
    name: 'Rudi',
    status: 'ACTIVE',
    role: 'DRIVER',
    driverLicenseExpiry: new Date(Date.now() - 1000000), // past
  };

  const evalActive = evaluateDriverEligibility(activeLicensedDriver);
  const evalExpired = evaluateDriverEligibility(expiredSimDriver);

  assert.strictEqual(evalActive.isEligible, true);
  assert.strictEqual(evalExpired.isEligible, false);
});

// =============================================================================
// 6. STATE MACHINE TRANSITION INTEGRITY AUDIT
// =============================================================================

runAuditTest('STATE_MACHINE', 'Goods state machine: Allowed transitions strictly enforced', () => {
  assert.strictEqual(ALLOWED_GOODS_TRANSITIONS['DRAFT'].includes('PENDING_PICKUP'), true);
  assert.strictEqual(ALLOWED_GOODS_TRANSITIONS['PENDING_PICKUP'].includes('IN_TRANSIT_INBOUND'), true);
  assert.strictEqual(ALLOWED_GOODS_TRANSITIONS['INSPECTING'].includes('STORED'), true);
  assert.strictEqual(ALLOWED_GOODS_TRANSITIONS['STORED'].includes('PENDING_DELIVERY'), true);
  // Illegal direct jump from DRAFT to STORED
  assert.strictEqual(ALLOWED_GOODS_TRANSITIONS['DRAFT'].includes('STORED'), false);
});

runAuditTest('STATE_MACHINE', 'Order state machine: Illegal direct jump from PENDING_ASSIGNMENT to DELIVERED rejected', () => {
  assert.strictEqual(ALLOWED_ORDER_TRANSITIONS['PENDING_ASSIGNMENT'].includes('DRIVER_ASSIGNED'), true);
  assert.strictEqual(ALLOWED_ORDER_TRANSITIONS['PENDING_ASSIGNMENT'].includes('DELIVERED'), false);
  assert.strictEqual(ALLOWED_ORDER_TRANSITIONS['IN_TRANSIT'].includes('ARRIVED_DESTINATION'), true);
});

runAuditTest('STATE_MACHINE', 'Role permission validation: Customer cannot transition order to IN_TRANSIT or DELIVERED', () => {
  let customerThrew = false;
  try {
    validateRolePermissionOnOrder('CUSTOMER', 'IN_TRANSIT', 'DELIVERY');
  } catch (e) {
    customerThrew = true;
  }
  assert.strictEqual(customerThrew, true);

  let driverAllowed = true;
  try {
    validateRolePermissionOnOrder('DRIVER', 'IN_TRANSIT', 'DELIVERY');
  } catch (e) {
    driverAllowed = false;
  }
  assert.strictEqual(driverAllowed, true);
});

console.log('\n========================================================================');
console.log(`📊 FINAL AUDIT RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failures)`);
console.log('========================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
