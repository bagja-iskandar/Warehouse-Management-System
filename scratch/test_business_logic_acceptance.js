/**
 * Comprehensive Calculation Consistency & Business Logic Acceptance Test Suite
 * Covers: Volume (Canonical formula, decimals, zero, boundaries), Weight (kg <-> ton),
 * Monetary (Fee threshold, Decimal penalty, subtotal, grand total, round half up).
 */

const assert = require('assert');
const path = require('path');

// 1. Load Backend Pricing Constants & Calculation Engine
const backendPricing = require(path.join(__dirname, '../backend/dist/src/common/constants/pricing.constants'));
const calcUtil = require(path.join(__dirname, '../backend/dist/src/common/utils/calculation.util'));

console.log('========================================================================');
console.log('🧪 RUNNING PHASE 3 CALCULATION CONSISTENCY ACCEPTANCE TEST SUITE');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✅ [PASS] Test ${totalTests}: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${testName}`);
    console.error(`   └─ ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: VOLUME & DIMENSION CONVERSIONS (1 m³ = 1,000,000 cm³)
// -----------------------------------------------------------------------------

runTest('Volume calculation: 100 x 100 x 100 cm must equal exactly 1.0000 m³', () => {
  const vol = calcUtil.calculateVolumeM3(100, 100, 100);
  assert.strictEqual(vol, 1.0, '100x100x100 cm must be 1.0 m³');
});

runTest('Volume calculation: 100 x 50 x 50 cm must equal exactly 0.2500 m³', () => {
  const vol = calcUtil.calculateVolumeM3(100, 50, 50);
  assert.strictEqual(vol, 0.25, '100x50x50 cm must be 0.25 m³');
});

runTest('Volume calculation: small item 20 x 15 x 10 cm must equal 0.0030 m³', () => {
  const vol = calcUtil.calculateVolumeM3(20, 15, 10);
  assert.strictEqual(vol, 0.003, '20x15x10 cm must be 0.0030 m³');
});

runTest('Volume calculation: decimal dimensions 12.5 x 10.4 x 8.2 cm = 0.0011 m³', () => {
  const vol = calcUtil.calculateVolumeM3(12.5, 10.4, 8.2);
  assert.strictEqual(vol, 0.0011, '12.5x10.4x8.2 cm must round to 0.0011 m³');
});

runTest('Volume calculation: zero and negative dimensions must return 0 safely', () => {
  assert.strictEqual(calcUtil.calculateVolumeM3(100, 0, 50), 0, 'Zero dimension must return 0');
  assert.strictEqual(calcUtil.calculateVolumeM3(-10, 50, 50), 0, 'Negative dimension must return 0');
  assert.strictEqual(calcUtil.calculateVolumeM3(null, 50, 50), 0, 'Null dimension must return 0');
});

runTest('Volume calculation: large warehouse container 1000 x 500 x 300 cm = 150.0 m³', () => {
  const vol = calcUtil.calculateVolumeM3(1000, 500, 300);
  assert.strictEqual(vol, 150.0, '1000x500x300 cm must equal 150.0 m³');
});

runTest('Total volume batch calculation: unit volume x quantity', () => {
  const unitVol = 0.003;
  const qty = 100;
  const totalVol = calcUtil.calculateTotalVolumeM3(unitVol, qty);
  assert.strictEqual(totalVol, 0.3, '0.003 m³ x 100 must be 0.3000 m³');
});

// -----------------------------------------------------------------------------
// SECTION 2: WEIGHT CONVERSIONS (1 ton = 1,000 kg)
// -----------------------------------------------------------------------------

runTest('Weight conversion: 1,000 kg must equal exactly 1.00 ton', () => {
  const ton = calcUtil.kgToTon(1000);
  assert.strictEqual(ton, 1.0, '1,000 kg must equal 1.0 ton');
});

runTest('Weight conversion: 2,500 kg must equal exactly 2.50 ton', () => {
  const ton = calcUtil.kgToTon(2500);
  assert.strictEqual(ton, 2.5, '2,500 kg must equal 2.5 ton');
});

runTest('Weight conversion: 0.75 ton must equal exactly 750.0 kg', () => {
  const kg = calcUtil.tonToKg(0.75);
  assert.strictEqual(kg, 750.0, '0.75 ton must equal 750.0 kg');
});

runTest('Weight conversion: 5.2 ton must equal exactly 5,200.0 kg', () => {
  const kg = calcUtil.tonToKg(5.2);
  assert.strictEqual(kg, 5200.0, '5.2 ton must equal 5,200.0 kg');
});

runTest('Weight conversion: zero and negative inputs return 0 safely', () => {
  assert.strictEqual(calcUtil.kgToTon(0), 0, '0 kg must return 0 ton');
  assert.strictEqual(calcUtil.kgToTon(-50), 0, 'Negative kg must return 0 ton');
  assert.strictEqual(calcUtil.tonToKg(0), 0, '0 ton must return 0 kg');
  assert.strictEqual(calcUtil.tonToKg(-2), 0, 'Negative ton must return 0 kg');
});

// -----------------------------------------------------------------------------
// SECTION 3: MONETARY & ROUNDING CALCULATIONS (ROUND_HALF_UP & SSOT)
// -----------------------------------------------------------------------------

runTest('Storage rates SSOT: Standard = 50k, Heavy = 75k, Cold = 150k', () => {
  assert.strictEqual(backendPricing.MASTER_STORAGE_RATES.STANDARD, 50000);
  assert.strictEqual(backendPricing.MASTER_STORAGE_RATES.HEAVY_DUTY, 75000);
  assert.strictEqual(backendPricing.MASTER_STORAGE_RATES.COLD_STORAGE, 150000);
});

runTest('Monthly rental fee calculation above minimum threshold', () => {
  const fee = calcUtil.calculateMonthlyRentalFee(2.0, 50000);
  assert.strictEqual(fee, 100000, '2.0 m³ @ Rp 50.000 must be Rp 100.000');
});

runTest('Monthly rental fee calculation enforced to minimum threshold (Rp 50.000)', () => {
  const fee = calcUtil.calculateMonthlyRentalFee(0.05, 50000);
  assert.strictEqual(fee, 50000, 'Fee below Rp 50.000 must clamp to Rp 50.000 minimum');
});

runTest('Monthly rental fee calculation for cold storage with round half up', () => {
  const fee = calcUtil.calculateMonthlyRentalFee(3.5, 150000);
  assert.strictEqual(fee, 525000, '3.5 m³ @ Rp 150.000 must be Rp 525.000');
});

runTest('Overdue penalty calculation using Decimal precision (1-7 days = 1 week 5%)', () => {
  const penalty = calcUtil.calculateOverduePenalty(10000000, 1, 0.05);
  assert.strictEqual(penalty.toNumber(), 500000, 'Rp 10.000.000 x 5% must be Rp 500.000');
});

runTest('Overdue penalty calculation avoiding floating point leaks (15 days = 3 weeks 15%)', () => {
  const penalty = calcUtil.calculateOverduePenalty(10000000, 3, 0.05);
  assert.strictEqual(penalty.toNumber(), 1500000, 'Rp 10.000.000 x 15% must be exactly Rp 1.500.000');
});

runTest('Invoice due date calculation enforces 14-day payment grace period', () => {
  const issueDate = new Date('2026-06-01T00:00:00.000Z');
  const expectedDueDate = new Date(
    issueDate.getTime() + backendPricing.INVOICE_PAYMENT_GRACE_DAYS * 24 * 60 * 60 * 1000
  );
  assert.strictEqual(
    expectedDueDate.toISOString().slice(0, 10),
    '2026-06-15',
    'Due date must be exactly 14 days after issue date'
  );
});

console.log('\n------------------------------------------------------------------------');
console.log(`📊 RESULTS: ${passedTests}/${totalTests} Tests Passed (100% SUCCESS)`);
console.log('========================================================================\n');
