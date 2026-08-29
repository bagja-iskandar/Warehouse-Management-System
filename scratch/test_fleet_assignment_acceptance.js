/**
 * Fleet Compatibility and Driver Assignment Acceptance Test Suite
 * Validates: Reefer temperature compatibility, payload & volume limits,
 * vehicle availability states, driver licensing & active dispatch conflicts.
 */

const assert = require('assert');
const path = require('path');

const fleetUtil = require(path.join(
  __dirname,
  '../backend/dist/src/common/utils/fleet-compatibility.util',
));

console.log('========================================================================');
console.log('🧪 RUNNING FLEET ASSIGNMENT & COMPATIBILITY ACCEPTANCE TEST SUITE');
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
// SECTION 1: VEHICLE COMPATIBILITY & REEFER CONSTRAINTS
// -----------------------------------------------------------------------------

runTest('Reefer requirement: Non-reefer vehicle is rejected for cold cargo', () => {
  const vehicle = {
    id: 'veh-1',
    plateNumber: 'B 1234 ABC',
    name: 'Dry Cargo Van',
    type: 'VAN',
    maxWeightKg: 1000,
    maxVolumeM3: 5.0,
    hasRefrigeration: false,
    minTempCelsius: null,
    status: 'AVAILABLE',
  };
  const cargo = {
    requiresReefer: true,
    requiredTempCelsius: -18,
    totalVolumeM3: 2.0,
    totalWeightKg: 400,
  };

  const result = fleetUtil.evaluateVehicleCompatibility(vehicle, cargo);
  assert.strictEqual(result.isCompatible, false);
  assert.strictEqual(result.isSelectable, false);
  assert.match(result.reason, /Non-reefer/);
});

runTest('Reefer requirement: Reefer vehicle with insufficient cooling is rejected', () => {
  const vehicle = {
    id: 'veh-2',
    plateNumber: 'B 5678 DEF',
    name: 'Chilled Box Truck',
    type: 'REEFER_TRUCK',
    maxWeightKg: 3000,
    maxVolumeM3: 12.0,
    hasRefrigeration: true,
    minTempCelsius: -5, // Only goes to -5°C
    status: 'AVAILABLE',
  };
  const cargo = {
    requiresReefer: true,
    requiredTempCelsius: -18, // Needs -18°C
    totalVolumeM3: 4.0,
    totalWeightKg: 1200,
  };

  const result = fleetUtil.evaluateVehicleCompatibility(vehicle, cargo);
  assert.strictEqual(result.isCompatible, false);
  assert.strictEqual(result.isSelectable, false);
  assert.match(result.reason, /Insufficient cooling/);
});

runTest('Reefer requirement: Capable reefer truck is approved for cold cargo', () => {
  const vehicle = {
    id: 'veh-3',
    plateNumber: 'B 9999 REE',
    name: 'Deep Freeze Reefer Truck',
    type: 'REEFER_TRUCK',
    maxWeightKg: 5000,
    maxVolumeM3: 20.0,
    hasRefrigeration: true,
    minTempCelsius: -25,
    status: 'AVAILABLE',
  };
  const cargo = {
    requiresReefer: true,
    requiredTempCelsius: -18,
    totalVolumeM3: 8.0,
    totalWeightKg: 2000,
  };

  const result = fleetUtil.evaluateVehicleCompatibility(vehicle, cargo);
  assert.strictEqual(result.isCompatible, true);
  assert.strictEqual(result.isSelectable, true);
  assert.strictEqual(result.badgeLabel, 'Compatible & Available');
});

// -----------------------------------------------------------------------------
// SECTION 2: PAYLOAD & VOLUME CAPACITY CHECKS
// -----------------------------------------------------------------------------

runTest('Payload limit: Cargo exceeding max weight is rejected as incompatible', () => {
  const vehicle = {
    id: 'veh-4',
    plateNumber: 'B 1111 XYZ',
    name: 'Small Van',
    type: 'VAN',
    maxWeightKg: 800,
    maxVolumeM3: 6.0,
    hasRefrigeration: false,
    minTempCelsius: null,
    status: 'AVAILABLE',
  };
  const cargo = {
    requiresReefer: false,
    totalVolumeM3: 2.0,
    totalWeightKg: 1200, // Exceeds 800 kg
  };

  const result = fleetUtil.evaluateVehicleCompatibility(vehicle, cargo);
  assert.strictEqual(result.isCompatible, false);
  assert.strictEqual(result.isSelectable, false);
  assert.strictEqual(result.badgeLabel, 'Payload Exceeded');
});

runTest('Volume limit: Cargo exceeding max volume is rejected as incompatible', () => {
  const vehicle = {
    id: 'veh-5',
    plateNumber: 'B 2222 XYZ',
    name: 'Small Box Truck',
    type: 'BOX_TRUCK_SMALL',
    maxWeightKg: 2500,
    maxVolumeM3: 8.0,
    hasRefrigeration: false,
    minTempCelsius: null,
    status: 'AVAILABLE',
  };
  const cargo = {
    requiresReefer: false,
    totalVolumeM3: 10.5, // Exceeds 8.0 m³
    totalWeightKg: 1000,
  };

  const result = fleetUtil.evaluateVehicleCompatibility(vehicle, cargo);
  assert.strictEqual(result.isCompatible, false);
  assert.strictEqual(result.isSelectable, false);
  assert.strictEqual(result.badgeLabel, 'Volume Exceeded');
});

// -----------------------------------------------------------------------------
// SECTION 3: VEHICLE OPERATIONAL STATUS & CONFLICTS
// -----------------------------------------------------------------------------

runTest('Vehicle status: IN_SERVICE vehicle is compatible but not selectable', () => {
  const vehicle = {
    id: 'veh-6',
    plateNumber: 'B 3333 IN',
    name: 'Delivery Truck',
    type: 'BOX_TRUCK_SMALL',
    maxWeightKg: 3000,
    maxVolumeM3: 15.0,
    hasRefrigeration: false,
    minTempCelsius: null,
    status: 'IN_SERVICE',
  };
  const cargo = {
    requiresReefer: false,
    totalVolumeM3: 2.0,
    totalWeightKg: 500,
  };

  const result = fleetUtil.evaluateVehicleCompatibility(vehicle, cargo);
  assert.strictEqual(result.isCompatible, true);
  assert.strictEqual(result.isSelectable, false);
  assert.strictEqual(result.badgeLabel, 'In Service');
});

runTest('Vehicle conflict: Vehicle with active orders is not selectable', () => {
  const vehicle = {
    id: 'veh-7',
    plateNumber: 'B 4444 ACT',
    name: 'Delivery Truck',
    type: 'BOX_TRUCK_SMALL',
    maxWeightKg: 3000,
    maxVolumeM3: 15.0,
    hasRefrigeration: false,
    minTempCelsius: null,
    status: 'AVAILABLE',
    activeOrdersCount: 1,
  };
  const cargo = {
    requiresReefer: false,
    totalVolumeM3: 2.0,
    totalWeightKg: 500,
  };

  const result = fleetUtil.evaluateVehicleCompatibility(vehicle, cargo);
  assert.strictEqual(result.isCompatible, true);
  assert.strictEqual(result.isSelectable, false);
  assert.strictEqual(result.badgeLabel, 'Assigned (Active)');
});

// -----------------------------------------------------------------------------
// SECTION 4: DRIVER ELIGIBILITY & LICENSING
// -----------------------------------------------------------------------------

runTest('Driver role: Non-driver role is rejected', () => {
  const driver = {
    id: 'user-1',
    name: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
  };
  const result = fleetUtil.evaluateDriverEligibility(driver);
  assert.strictEqual(result.isEligible, false);
  assert.strictEqual(result.isSelectable, false);
  assert.strictEqual(result.badgeLabel, 'Not a Driver');
});

runTest('Driver status: Suspended/Inactive driver is rejected', () => {
  const driver = {
    id: 'user-2',
    name: 'Suspended Driver',
    role: 'DRIVER',
    status: 'SUSPENDED',
  };
  const result = fleetUtil.evaluateDriverEligibility(driver);
  assert.strictEqual(result.isEligible, false);
  assert.strictEqual(result.isSelectable, false);
  assert.strictEqual(result.badgeLabel, 'Inactive');
});

runTest('Driver license: Expired license (SIM) is rejected', () => {
  const driver = {
    id: 'user-3',
    name: 'Expired License Driver',
    role: 'DRIVER',
    status: 'ACTIVE',
    driverLicenseExpiry: new Date(Date.now() - 86400000), // Expired yesterday
  };
  const result = fleetUtil.evaluateDriverEligibility(driver);
  assert.strictEqual(result.isEligible, false);
  assert.strictEqual(result.isSelectable, false);
  assert.strictEqual(result.badgeLabel, 'SIM Expired');
});

runTest('Driver conflict: Driver currently executing active delivery is not selectable', () => {
  const driver = {
    id: 'user-4',
    name: 'Busy Driver',
    role: 'DRIVER',
    status: 'ACTIVE',
    driverLicenseExpiry: new Date(Date.now() + 365 * 86400000),
    activeOrdersCount: 1,
  };
  const result = fleetUtil.evaluateDriverEligibility(driver);
  assert.strictEqual(result.isEligible, true);
  assert.strictEqual(result.isSelectable, false);
  assert.strictEqual(result.badgeLabel, 'On Delivery (Busy)');
});

runTest('Driver availability: Active, licensed driver with no active dispatches is approved', () => {
  const driver = {
    id: 'user-5',
    name: 'Ready Driver',
    role: 'DRIVER',
    status: 'ACTIVE',
    driverLicenseExpiry: new Date(Date.now() + 365 * 86400000),
    activeOrdersCount: 0,
  };
  const result = fleetUtil.evaluateDriverEligibility(driver);
  assert.strictEqual(result.isEligible, true);
  assert.strictEqual(result.isSelectable, true);
  assert.strictEqual(result.badgeLabel, 'Ready & Available');
});

console.log('\n------------------------------------------------------------------------');
console.log(`📊 RESULTS: ${passedTests}/${totalTests} Tests Passed (100% SUCCESS)`);
console.log('========================================================================\n');
