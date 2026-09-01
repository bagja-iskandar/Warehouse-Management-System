async function testEndpoints() {
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@wms.id', password: '123456' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  console.log('========================================================================');
  console.log('📡 TESTING BACKEND API ENDPOINTS WITH ADMIN JWT');
  console.log('========================================================================\n');

  // 1. GET /api/v1/warehouses
  const whRes = await fetch('http://localhost:5000/api/v1/warehouses', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const whData = await whRes.json();
  console.log('1. GET /api/v1/warehouses:');
  console.log(`   └─ Status: ${whRes.status}`);
  console.log(`   └─ Warehouses Count: ${whData.data ? whData.data.length : 0}`);
  if (whData.data) {
    whData.data.forEach((w) => {
      console.log(`   └─ [${w.code}] ${w.name} (${w.city}): TotalCap=${w.totalCapacityM3} m³, Used=${w.usedCapacityM3} m³, Slots=${w.slotsCount}, OccSlots=${w.occupiedSlotsCount}`);
    });
  }

  // 2. GET /api/v1/analytics/admin-overview
  const ovRes = await fetch('http://localhost:5000/api/v1/analytics/admin-overview', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const ovData = await ovRes.json();
  console.log('\n2. GET /api/v1/analytics/admin-overview:');
  console.log(`   └─ Status: ${ovRes.status}`);
  if (ovData.data) {
    console.log(`   └─ Total Capacity: ${ovData.data.warehouse?.totalCapacityM3} m³`);
    console.log(`   └─ Used Capacity: ${ovData.data.warehouse?.usedCapacityM3} m³`);
    console.log(`   └─ Total Slots: ${ovData.data.warehouse?.totalSlots}`);
    console.log(`   └─ Available Slots: ${ovData.data.warehouse?.availableSlots}`);
    console.log(`   └─ Cold Storage Cap: ${ovData.data.warehouse?.zonesBreakdown?.coldStorage?.capacityM3} m³`);
    console.log(`   └─ Standard Storage Cap: ${ovData.data.warehouse?.zonesBreakdown?.standard?.capacityM3} m³`);
  }

  console.log('\n========================================================================');
}

testEndpoints();
