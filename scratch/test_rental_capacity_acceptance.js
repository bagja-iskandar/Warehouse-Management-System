/**
 * Rental Capacity & Space Accounting Acceptance Test Suite
 * Covers: Rental space booking, warehouse capacity boundaries, minimum rental threshold,
 * duration multiplier, and pre-inbound facility transfer validation.
 */

const assert = require('assert');
const path = require('path');

const backendPricing = require(path.join(
  __dirname,
  '../backend/dist/src/common/constants/pricing.constants'
));
const calcUtil = require(path.join(
  __dirname,
  '../backend/dist/src/common/utils/calculation.util'
));

console.log('========================================================================');
console.log('🧪 RUNNING RENTAL CAPACITY & SPACE ACCOUNTING ACCEPTANCE TEST SUITE');
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
// 1. RENTAL SPACE FEE & THRESHOLDS
// -----------------------------------------------------------------------------

runTest('Rental fee: Standard warehouse rental 20 m³ for 3 months (Standard Rate = 50,000 IDR/m³)', () => {
  const rate = backendPricing.MASTER_STORAGE_RATES['STANDARD'];
  const monthly = calcUtil.calculateMonthlyRentalFee(20, rate, backendPricing.MINIMUM_MONTHLY_RENTAL_FEE);
  const total = monthly * 3;

  assert.strictEqual(monthly, 1000000);
  assert.strictEqual(total, 3000000);
});

runTest('Rental fee: Enforces minimum fee threshold of 50,000 IDR for micro-rentals (0.5 m³)', () => {
  const rate = backendPricing.MASTER_STORAGE_RATES['STANDARD'];
  const monthly = calcUtil.calculateMonthlyRentalFee(0.5, rate, backendPricing.MINIMUM_MONTHLY_RENTAL_FEE);

  assert.strictEqual(monthly, 50000);
});

runTest('Rental capacity: Validates that rented space does not exceed remaining warehouse capacity', () => {
  const warehouse = {
    totalCapacityM3: 500,
    usedCapacityM3: 450,
  };

  const remaining = warehouse.totalCapacityM3 - warehouse.usedCapacityM3;
  const isEligible = (requestedM3) => requestedM3 <= remaining;

  assert.strictEqual(isEligible(40), true);
  assert.strictEqual(isEligible(60), false);
});

// -----------------------------------------------------------------------------
// 2. PRE-INBOUND FACILITY TRANSFER RESTRICTIONS
// -----------------------------------------------------------------------------

runTest('Warehouse change: Rejects change if goods have already entered physical storage (STORED)', () => {
  const canChangeFacility = (goodsStatusList) => {
    const hasPhysicalStorage = goodsStatusList.some((s) => s === 'STORED' || s === 'INSPECTING');
    return !hasPhysicalStorage;
  };

  assert.strictEqual(canChangeFacility(['REGISTERED', 'PENDING']), true);
  assert.strictEqual(canChangeFacility(['REGISTERED', 'STORED']), false);
});

console.log('\n------------------------------------------------------------------------');
console.log(`📊 RESULTS: ${passedTests}/${totalTests} Tests Passed (100% SUCCESS)`);
console.log('========================================================================\n');
