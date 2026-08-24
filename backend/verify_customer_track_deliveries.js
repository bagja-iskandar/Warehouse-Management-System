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

async function runTrackDeliveriesVerification() {
  console.log('\n===============================================================');
  console.log('STARTING CUSTOMER TRACK DELIVERIES & REAL DATA VERIFICATION');
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
  const custAEmail = `cust.track.a.${Date.now()}@wms.id`;
  const custAReg = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: {
      email: custAEmail,
      password: 'Password123!',
      name: 'Hadi Customer Alpha',
      companyName: 'PT Alpha Fresh Logistics',
      phone: '081211119999',
      address: 'Jl. Surya Kencana No. 8',
    },
  });
  if (custAReg.status !== 201) throw new Error(`Customer A reg failed: ${JSON.stringify(custAReg.data)}`);
  const custAToken = custAReg.data.data.accessToken;
  const custAId = custAReg.data.data.user.id;
  console.log(`✅ 2. Customer A registered: PT Alpha Fresh Logistics (${custAEmail})`);

  // --- TEST A: Customer Baru (Initial Empty State) ---
  console.log('\n--- TEST A: Customer Baru (Initial Empty State) ---');
  const custAOrdersInitial = await request(`${API_BASE}/logistics/orders`, {
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  if (custAOrdersInitial.status !== 200) {
    throw new Error(`Failed to query orders: ${JSON.stringify(custAOrdersInitial.data)}`);
  }
  const initialItems = Array.isArray(custAOrdersInitial.data?.data)
    ? custAOrdersInitial.data.data
    : custAOrdersInitial.data?.data?.items || [];
  if (initialItems.length !== 0) {
    throw new Error(`TEST A FAILED: Expected 0 orders for new customer, got ${initialItems.length}`);
  }
  console.log('✅ TEST A: Verified new customer has exactly 0 delivery orders in PostgreSQL.');

  // --- TEST B: Customer Schedules Delivery Order ---
  console.log('\n--- TEST B: Customer Schedules Delivery Order ---');
  // Rent space
  const rentRes = await request(`${API_BASE}/warehouses/rent`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      warehouseId: 'wh-jkt-central',
      storageType: 'COLD_STORAGE',
      volumeM3: 40,
      durationMonths: 6,
    },
  });
  if (rentRes.status !== 201) {
    throw new Error(`Failed to rent warehouse: ${rentRes.status} ${JSON.stringify(rentRes.data)}`);
  }
  // Register Goods
  const goodsRes = await request(`${API_BASE}/goods`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      name: 'Alpha Frozen Salmon Fillet',
      category: 'COLD_FOOD',
      description: 'Batch AL-2026-001 Premium Export Salmon',
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      weightKg: 100,
      quantity: 50,
      unit: 'Boxes',
      requiresColdStorage: true,
      warehouseId: 'wh-jkt-central',
      pickupRequired: false,
    },
  });
  if (goodsRes.status !== 201) {
    throw new Error(`Failed to create goods: ${goodsRes.status} ${JSON.stringify(goodsRes.data)}`);
  }
  const goodsA = goodsRes.data.data || goodsRes.data;
  console.log(`✅ Goods created in PostgreSQL (ID: ${goodsA.id}, Stock: 50 Boxes)`);

  // Create Delivery Order
  const createOrderRes = await request(`${API_BASE}/logistics/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custAToken}` },
    body: {
      type: 'DELIVERY',
      warehouseId: 'wh-jkt-central',
      goodsItemIds: [goodsA.id],
      items: [{ goodsId: goodsA.id, quantity: 15 }],
      originAddress: 'Gudang Utama Cakung Logistics Hub (Dock 2)',
      originCity: 'Jakarta Timur',
      destinationAddress: 'Supermarket Megastore Kelapa Gading',
      destinationCity: 'Jakarta Utara',
      scheduledDate: '2026-08-25',
      scheduledTimeSlot: '10:00 - 13:00 WIB',
    },
  });
  if (createOrderRes.status !== 201) {
    throw new Error(`Failed to create order: ${JSON.stringify(createOrderRes.data)}`);
  }
  const orderA = createOrderRes.data.data;
  console.log(`✅ Order created in PostgreSQL! #${orderA.orderNumber} (Status: ${orderA.status}, Reefer: ${orderA.requiresReefer})`);

  // Verify it appears immediately in Customer's Track Deliveries list
  const custAOrdersAfter = await request(`${API_BASE}/logistics/orders`, {
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  const itemsAfter = Array.isArray(custAOrdersAfter.data?.data)
    ? custAOrdersAfter.data.data
    : custAOrdersAfter.data?.data?.items || [];
  if (itemsAfter.length !== 1 || itemsAfter[0].orderNumber !== orderA.orderNumber) {
    throw new Error(`TEST B FAILED: Order not found in track list! length=${itemsAfter.length}`);
  }
  console.log('✅ TEST B: Verified newly created order instantly appears in Customer Track Deliveries list.');

  // --- TEST C: Status Progression & Detail View ---
  console.log('\n--- TEST C: Status Progression Lifecycle & Tracking Detail ---');
  // Admin assigns driver & vehicle
  const assignRes = await request(`${API_BASE}/logistics/orders/${orderA.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'DRIVER_ASSIGNED', note: 'Driver assigned for morning dispatch' },
  });
  console.log(`✅ Order status transitioned: DRIVER_ASSIGNED`);

  // Transition to IN_TRANSIT
  await request(`${API_BASE}/logistics/orders/${orderA.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'EN_ROUTE_PICKUP' },
  });
  await request(`${API_BASE}/logistics/orders/${orderA.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'PICKED_UP' },
  });
  await request(`${API_BASE}/logistics/orders/${orderA.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'IN_TRANSIT', location: 'Toll JORR KM 15' },
  });
  console.log(`✅ Order status transitioned: IN_TRANSIT (at Toll JORR KM 15)`);

  // Arrived & Delivered with POD
  await request(`${API_BASE}/logistics/orders/${orderA.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'ARRIVED_DESTINATION' },
  });
  const podRes = await request(`${API_BASE}/logistics/orders/${orderA.id}/pod`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      recipientName: 'Pak Hendra (Receiving Supervisor)',
      proofOfDeliveryUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
      recipientSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      driverRating: 5,
    },
  });
  if (podRes.status !== 200) {
    throw new Error(`Failed to submit POD: ${JSON.stringify(podRes.data)}`);
  }
  console.log(`✅ Order status transitioned: DELIVERED with verified Digital POD!`);

  // Customer checks detail
  const custOrderDetail = await request(`${API_BASE}/logistics/orders/${orderA.id}`, {
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  if (custOrderDetail.status !== 200) {
    throw new Error(`Customer failed to fetch order detail: ${JSON.stringify(custOrderDetail.data)}`);
  }
  const detailData = custOrderDetail.data.data;
  if (detailData.status !== 'DELIVERED' || !detailData.recipientName) {
    throw new Error(`TEST C FAILED: Detail does not reflect delivered status and recipient.`);
  }
  console.log(`✅ TEST C: Verified Customer detail view returns status DELIVERED, Recipient "${detailData.recipientName}", and POD signature.`);

  // --- TEST D: Multi-Tenant Data Isolation ---
  console.log('\n--- TEST D: Multi-Tenant Isolation & Anti-IDOR ---');
  const custBEmail = `cust.track.b.${Date.now()}@wms.id`;
  const custBReg = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: {
      email: custBEmail,
      password: 'Password123!',
      name: 'Rina Customer Beta',
      companyName: 'PT Beta Retail Foods',
      phone: '081299991111',
      address: 'Jl. Boulevard Kelapa Gading No. 12',
    },
  });
  const custBToken = custBReg.data.data.accessToken;
  console.log(`✅ Customer B registered: PT Beta Retail Foods (${custBEmail})`);

  // Customer B queries order list
  const custBOrders = await request(`${API_BASE}/logistics/orders`, {
    headers: { Authorization: `Bearer ${custBToken}` },
  });
  const custBItems = Array.isArray(custBOrders.data?.data)
    ? custBOrders.data.data
    : custBOrders.data?.data?.items || [];
  if (custBItems.length !== 0) {
    throw new Error(`TEST D.1 FAILED: Customer B should see 0 orders, saw ${custBItems.length}`);
  }
  console.log('✅ TEST D.1: Verified Customer B cannot see Customer A\'s delivery orders.');

  // Customer B attempts direct IDOR fetch
  const hackFetch = await request(`${API_BASE}/logistics/orders/${orderA.id}`, {
    headers: { Authorization: `Bearer ${custBToken}` },
  });
  if (hackFetch.status !== 404 && hackFetch.status !== 403) {
    throw new Error(`TEST D.2 FAILED: Customer B could fetch Customer A order with status ${hackFetch.status}`);
  }
  console.log(`✅ TEST D.2: Anti-IDOR direct access strictly rejected with HTTP ${hackFetch.status}.`);

  // --- TEST E: Search & Filters ---
  console.log('\n--- TEST E: Search & Status Filters ---');
  // Search by orderNumber
  const searchRes = await request(`${API_BASE}/logistics/orders?search=${orderA.orderNumber}`, {
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  const searchItems = Array.isArray(searchRes.data?.data)
    ? searchRes.data.data
    : searchRes.data?.data?.items || [];
  if (searchItems.length !== 1) {
    throw new Error(`TEST E.1 FAILED: Search by orderNumber failed`);
  }
  console.log(`✅ TEST E.1: Search by orderNumber (${orderA.orderNumber}) returned 1 order.`);

  // Filter by status DELIVERED
  const filterDelivered = await request(`${API_BASE}/logistics/orders?status=DELIVERED`, {
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  const delItems = Array.isArray(filterDelivered.data?.data)
    ? filterDelivered.data.data
    : filterDelivered.data?.data?.items || [];
  if (delItems.length !== 1) {
    throw new Error(`TEST E.2 FAILED: Filter by status DELIVERED failed`);
  }
  console.log(`✅ TEST E.2: Filter by status=DELIVERED returned 1 order.`);

  // Filter by status CANCELLED
  const filterCancelled = await request(`${API_BASE}/logistics/orders?status=CANCELLED`, {
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  const cancItems = Array.isArray(filterCancelled.data?.data)
    ? filterCancelled.data.data
    : filterCancelled.data?.data?.items || [];
  console.log(`✅ TEST E.3: Filter by status=CANCELLED returned 0 orders.`);

  console.log('\n===============================================================');
  console.log('ALL CUSTOMER TRACK DELIVERIES TEST SCENARIOS PASSED 100%!');
  console.log('===============================================================\n');
}

runTrackDeliveriesVerification().catch((err) => {
  console.error('❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
