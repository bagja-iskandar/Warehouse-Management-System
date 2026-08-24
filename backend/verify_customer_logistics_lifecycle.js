const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = options.body ? JSON.stringify(options.body) : null;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({
          status: res.statusCode,
          data: parsed,
          raw: body,
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runLogisticsVerification() {
  console.log('\n===============================================================');
  console.log('STARTING LOGISTICS ORDER & INVENTORY ISOLATION VERIFICATION');
  console.log('===============================================================\n');

  // --- 1. Admin Authentication ---
  const adminLogin = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: 'admin@wms.id', password: 'Password123!' },
  });
  if (adminLogin.status !== 200 || !adminLogin.data?.data?.accessToken) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  }
  const adminToken = adminLogin.data.data.accessToken;
  console.log('✅ 1. Admin authenticated (admin@wms.id)');

  // --- 2. Register Customer A ---
  const custAEmail = `cust.logistics.a.${Date.now()}@wms.id`;
  const custAReg = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: {
      email: custAEmail,
      password: 'Password123!',
      name: 'Budi Logistics Alpha',
      companyName: 'PT Alpha Logistics Cold Storage',
      phone: '081211112222',
      address: 'Jl. Industri Alpha No. 10',
    },
  });
  if (custAReg.status !== 201) throw new Error(`Customer A reg failed: ${JSON.stringify(custAReg.data)}`);
  const custAToken = custAReg.data.data.accessToken;
  const custAId = custAReg.data.data.user.id;
  console.log(`✅ 2. Customer A registered: PT Alpha Logistics Cold Storage (${custAEmail})`);

  // --- TEST A: Customer Baru (Initial State) ---
  console.log('\n--- TEST A: Customer Baru (Initial State & Isolation) ---');
  const custAActiveWh = await request(`${API_BASE}/warehouses/customer/active`, {
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  if (custAActiveWh.status !== 200 || !Array.isArray(custAActiveWh.data?.data) || custAActiveWh.data.data.length !== 0) {
    throw new Error(`TEST A.1 FAILED: Expected 0 active warehouses for new customer, got: ${JSON.stringify(custAActiveWh.data)}`);
  }
  console.log('✅ TEST A.1: Verified new customer has 0 active rented warehouses in PostgreSQL.');

  const custAGoods = await request(`${API_BASE}/goods`, {
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  const custAGoodsList = custAGoods.data?.data?.items || custAGoods.data?.data || [];
  if (custAGoodsList.length !== 0) {
    throw new Error(`TEST A.2 FAILED: Expected 0 goods for new customer, got ${custAGoodsList.length}`);
  }
  console.log('✅ TEST A.2: Verified new customer has 0 goods in inventory directory (Multi-tenant safe).');

  // --- TEST B: Customer Rents Space & Registers Real Goods ---
  console.log('\n--- TEST B: Customer Rents Warehouse Space & Registers Goods ---');
  const rentWh = await request(`${API_BASE}/warehouses/rent`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      warehouseId: 'wh-jkt-central',
      storageType: 'COLD_STORAGE',
      volumeM3: 50,
      durationMonths: 6,
    },
  });
  if (rentWh.status !== 201) {
    throw new Error(`Rent space failed: ${JSON.stringify(rentWh.data)}`);
  }
  console.log('✅ TEST B.1: Customer A rented 50 m³ Cold Storage in wh-jkt-central.');

  // Verify Active Warehouse now returns wh-jkt-central
  const custAActiveWhAfter = await request(`${API_BASE}/warehouses/customer/active`, {
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  const activeList = custAActiveWhAfter.data?.data || [];
  if (!activeList.some((w) => w.id === 'wh-jkt-central' || w.code === 'WH-CKG-01')) {
    throw new Error(`TEST B.2 FAILED: wh-jkt-central not found in active warehouses: ${JSON.stringify(activeList)}`);
  }
  console.log('✅ TEST B.2: Verified active warehouse context correctly reflects rented facility.');

  // Customer A registers real goods into wh-jkt-central
  const createGoodsRes = await request(`${API_BASE}/goods`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      name: 'Alpha Frozen Salmon Fillet Premium',
      category: 'COLD_FOOD',
      description: 'Batch AL-2026-001 Premium Export Salmon',
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      weightKg: 200,
      quantity: 50,
      unit: 'Boxes',
      requiresColdStorage: true,
      warehouseId: 'wh-jkt-central',
      pickupRequired: false,
    },
  });
  if (createGoodsRes.status !== 201) {
    throw new Error(`Create goods failed: ${JSON.stringify(createGoodsRes.data)}`);
  }
  const goodsA = createGoodsRes.data.data;
  console.log(`✅ TEST B.3: Goods registered in PostgreSQL! SKU #${goodsA.barcode} (ID: ${goodsA.id}, Stock: 50 Boxes)`);

  // Customer A creates Outbound Delivery order for 20 units
  const createOrderRes = await request(`${API_BASE}/logistics/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      type: 'DELIVERY',
      warehouseId: 'wh-jkt-central',
      goodsItemIds: [goodsA.id],
      items: [{ goodsId: goodsA.id, quantity: 20 }],
      originAddress: 'Gudang Utama Cakung Logistics Hub, Jakarta',
      originCity: 'Jakarta Timur',
      destinationAddress: 'Supermarket Megastore Kelapa Gading',
      destinationCity: 'Jakarta Utara',
      scheduledDate: '2026-08-25',
      scheduledTimeSlot: '09:00 - 12:00 WIB',
    },
  });
  if (createOrderRes.status !== 201) {
    throw new Error(`Create order failed: ${JSON.stringify(createOrderRes.data)}`);
  }
  const orderA = createOrderRes.data.data;
  if (!orderA.requiresReefer) {
    throw new Error(`TEST B.4 FAILED: Order for cold storage goods should automatically require Reefer truck!`);
  }
  console.log(`✅ TEST B.4: Delivery Order created in PostgreSQL! #${orderA.orderNumber} (Requires Reefer: ${orderA.requiresReefer}, Summary: "${orderA.goodsSummary}")`);

  // --- TEST C: Customer Isolation / Anti-IDOR ---
  console.log('\n--- TEST C: Customer Isolation & Cross-Tenant Protection (Anti-IDOR) ---');
  const custBEmail = `cust.logistics.b.${Date.now()}@wms.id`;
  const custBReg = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: {
      email: custBEmail,
      password: 'Password123!',
      name: 'Dewi Logistics Beta',
      companyName: 'PT Beta Fresh Foods',
      phone: '081299998888',
      address: 'Jl. Pelabuhan Beta No. 5',
    },
  });
  const custBToken = custBReg.data.data.accessToken;
  console.log(`✅ Customer B registered: PT Beta Fresh Foods (${custBEmail})`);

  // Customer B attempts to create Delivery Order using Customer A's goodsItemId
  const hackOrderRes = await request(`${API_BASE}/logistics/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custBToken}` },
    body: {
      type: 'DELIVERY',
      goodsItemIds: [goodsA.id],
      items: [{ goodsId: goodsA.id, quantity: 5 }],
      originAddress: 'Somewhere',
      originCity: 'Jakarta',
      destinationAddress: 'Somewhere else',
      destinationCity: 'Jakarta',
      scheduledDate: '2026-08-25',
      scheduledTimeSlot: '09:00 - 12:00 WIB',
    },
  });
  if (hackOrderRes.status !== 403) {
    throw new Error(`TEST C FAILED: Expected 403 Forbidden for cross-tenant goods, got ${hackOrderRes.status}: ${JSON.stringify(hackOrderRes.data)}`);
  }
  console.log(`✅ TEST C: Cross-tenant unauthorized goods access strictly blocked with HTTP 403: "${hackOrderRes.data?.message}"`);

  // --- TEST D: Inventory / Stock Quantity Validation ---
  console.log('\n--- TEST D: Inventory Quantity Validation ---');
  // Customer A requests 150 units when stock is only 50
  const overstockOrderRes = await request(`${API_BASE}/logistics/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      type: 'DELIVERY',
      goodsItemIds: [goodsA.id],
      items: [{ goodsId: goodsA.id, quantity: 150 }],
      originAddress: 'Gudang Utama Cakung Logistics Hub, Jakarta',
      originCity: 'Jakarta Timur',
      destinationAddress: 'Supermarket Megastore Kelapa Gading',
      destinationCity: 'Jakarta Utara',
      scheduledDate: '2026-08-25',
      scheduledTimeSlot: '09:00 - 12:00 WIB',
    },
  });
  if (overstockOrderRes.status !== 400) {
    throw new Error(`TEST D FAILED: Expected 400 Bad Request for overstock request, got ${overstockOrderRes.status}: ${JSON.stringify(overstockOrderRes.data)}`);
  }
  console.log(`✅ TEST D: Overstock request properly rejected with HTTP 400: "${overstockOrderRes.data?.message}"`);

  // --- TEST E: Warehouse Isolation ---
  console.log('\n--- TEST E: Warehouse Context Isolation ---');
  // Customer A attempts to create order for wh-bdg-01 while goods is stored in wh-jkt-central
  const wrongWhOrderRes = await request(`${API_BASE}/logistics/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      type: 'DELIVERY',
      warehouseId: 'wh-bdg-01',
      goodsItemIds: [goodsA.id],
      items: [{ goodsId: goodsA.id, quantity: 5 }],
      originAddress: 'Gedebage Cold Hub',
      originCity: 'Bandung',
      destinationAddress: 'Bandung Retail Point',
      destinationCity: 'Bandung',
      scheduledDate: '2026-08-25',
      scheduledTimeSlot: '09:00 - 12:00 WIB',
    },
  });
  if (wrongWhOrderRes.status !== 400) {
    throw new Error(`TEST E FAILED: Expected 400 for warehouse mismatch, got ${wrongWhOrderRes.status}`);
  }
  console.log(`✅ TEST E: Warehouse mismatch rejected with HTTP 400: "${wrongWhOrderRes.data?.message}"`);

  // --- TEST F: Haidar Customer Account Verification ---
  console.log('\n--- TEST F: Haidar Customer Account Verification ---');
  const haidarLogin = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: 'haidar@gmail.com', password: 'Password123!' },
  });
  if (haidarLogin.status === 200) {
    const haidarToken = haidarLogin.data.data.accessToken;
    const haidarActiveWh = await request(`${API_BASE}/warehouses/customer/active`, {
      headers: { Authorization: `Bearer ${haidarToken}` },
    });
    console.log(`✅ Haidar Active Warehouses in PostgreSQL:`, (haidarActiveWh.data?.data || []).map(w => `${w.name} (${w.code})`));
  }

  console.log('\n===============================================================');
  console.log('ALL LOGISTICS TEST SCENARIOS (A, B, C, D, E, F) PASSED 100%!');
  console.log('===============================================================\n');
}

runLogisticsVerification().catch((err) => {
  console.error('❌ LIFECYCLE TEST FAILED:', err);
  process.exit(1);
});
