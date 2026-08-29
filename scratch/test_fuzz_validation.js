/**
 * ============================================================================
 * WMS NUSANTARA — FUZZING & BOUNDARY VALIDATION TEST SUITE
 * ============================================================================
 * Tests extreme edge cases, invalid data types, malformed strings, nulls,
 * negative numbers, overflows, and boundary values.
 */

const assert = require('assert');
const path = require('path');

const calcUtil = require(path.join(__dirname, '../backend/dist/src/common/utils/calculation.util'));
const { calculateSlotMetrics } = require(path.join(__dirname, '../backend/dist/src/modules/warehouse/utils/warehouse-slot-metrics.util'));
const { evaluateVehicleCompatibility, evaluateDriverEligibility } = require(path.join(__dirname, '../backend/dist/src/common/utils/fleet-compatibility.util'));

console.log('========================================================================');
console.log('🧪 RUNNING FUZZING & BOUNDARY VALUE AUDIT SUITE');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runFuzzTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✅ [PASS] Fuzz #${totalTests}: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Fuzz #${totalTests}: ${testName}`);
    console.error(`   └─ Error: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// 1. VOLUME CALCULATION FUZZING
// -----------------------------------------------------------------------------

runFuzzTest('calculateVolumeM3 handles null, undefined, NaN, and Infinity safely (returns 0)', () => {
  assert.strictEqual(calcUtil.calculateVolumeM3(null, 100, 100), 0);
  assert.strictEqual(calcUtil.calculateVolumeM3(undefined, 100, 100), 0);
  assert.strictEqual(calcUtil.calculateVolumeM3(NaN, 100, 100), 0);
  assert.strictEqual(calcUtil.calculateVolumeM3(Infinity, 100, 100), 0);
  assert.strictEqual(calcUtil.calculateVolumeM3(-Infinity, 100, 100), 0);
});

runFuzzTest('calculateVolumeM3 handles negative and microscopic decimals safely', () => {
  assert.strictEqual(calcUtil.calculateVolumeM3(-1, 100, 100), 0);
  assert.strictEqual(calcUtil.calculateVolumeM3(0.000001, 0.000001, 0.000001), 0);
  assert.strictEqual(calcUtil.calculateVolumeM3(1, 1, 1), 0.0000); // 1 cm3 = 0.000001 m3 -> rounded to 4 decimals = 0.0000
});

// -----------------------------------------------------------------------------
// 2. WEIGHT CONVERSION FUZZING
// -----------------------------------------------------------------------------

runFuzzTest('kgToTon & tonToKg handle extreme edge values safely', () => {
  assert.strictEqual(calcUtil.kgToTon(null), 0);
  assert.strictEqual(calcUtil.kgToTon(undefined), 0);
  assert.strictEqual(calcUtil.kgToTon(NaN), 0);
  assert.strictEqual(calcUtil.kgToTon(-9999), 0);
  assert.strictEqual(calcUtil.tonToKg(null), 0);
  assert.strictEqual(calcUtil.tonToKg(-10), 0);
});

// -----------------------------------------------------------------------------
// 3. WAREHOUSE SLOT METRICS FUZZING
// -----------------------------------------------------------------------------

runFuzzTest('calculateSlotMetrics handles zero capacity, negative items, and corrupted structures safely', () => {
  const corruptedGoods = [
    { id: 'g1', volumeM3: null, weightKg: undefined },
    { id: 'g2', volumeM3: -5, weightKg: -100 },
    { id: 'g3', volumeM3: 'invalid_str', weightKg: 'nan' },
  ];

  const metrics = calculateSlotMetrics(0, corruptedGoods, 0, 'AVAILABLE');
  assert.strictEqual(metrics.actualSlotUsedM3, 0);
  assert.strictEqual(metrics.actualSlotUsedWeightKg, 0);
  assert.strictEqual(metrics.volPct, 0);
  assert.strictEqual(metrics.weightPct, 0);
  assert.strictEqual(metrics.capacityStatus, 'Vacant');
});

// -----------------------------------------------------------------------------
// 4. FLEET COMPATIBILITY FUZZING
// -----------------------------------------------------------------------------

runFuzzTest('evaluateVehicleCompatibility handles extreme cargo payloads and missing attributes safely', () => {
  const vehicle = {
    id: 'v-extreme',
    plateNumber: 'B 9999 FUZZ',
    name: 'Fuzz Vehicle',
    type: 'VAN',
    hasRefrigeration: false,
    minTempCelsius: null,
    maxVolumeM3: 10,
    maxWeightKg: 1000,
    status: 'AVAILABLE',
  };

  const extremeCargo = {
    requiresReefer: false,
    totalVolumeM3: 99999999,
    totalWeightKg: 99999999,
  };

  const result = evaluateVehicleCompatibility(vehicle, extremeCargo);
  assert.strictEqual(result.isCompatible, false);
  assert.strictEqual(result.isSelectable, false);
});

runFuzzTest('evaluateDriverEligibility handles null license dates and missing roles safely', () => {
  const malformedDriver = {
    id: 'd-null',
    name: 'Unknown',
    status: 'ACTIVE',
    role: 'CUSTOMER', // not DRIVER
    driverLicenseExpiry: null,
  };

  const result = evaluateDriverEligibility(malformedDriver);
  assert.strictEqual(result.isEligible, false);
  assert.strictEqual(result.isSelectable, false);
});

console.log('\n------------------------------------------------------------------------');
console.log(`📊 FUZZ RESULTS: ${passedTests}/${totalTests} Tests Passed (100% SUCCESS)`);
console.log('========================================================================\n');
