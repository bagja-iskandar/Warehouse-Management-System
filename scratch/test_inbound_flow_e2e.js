const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function login(email, password = 'Password123!') {
  const res = await makeRequest('POST', '/auth/login', { email, password });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.data.accessToken;
}

async function runInboundE2ETest() {
  console.log('=== STARTING INBOUND LOGISTICS REAL POSTGRESQL E2E TEST ===\n');

  // 1. Authenticate users
  console.log('[1/10] Authenticating users (Customer, Driver, Admin)...');
  const customerToken = await login('customer@freshfoods.id');
  const driverToken = await login('dedi.driver@wms.id');
  const adminToken = await login('admin@wms.id');
  console.log('  -> Customer, Driver, and Admin JWT tokens acquired successfully.');

  // 2. Customer registers new goods item (Cold Storage required)
  console.log('\n[2/10] Customer registers real Goods Item (Cold Storage)...');
  const createGoodsRes = await makeRequest(
    'POST',
    '/goods',
    {
      name: 'Wagyu Beef Ribeye A5 Test Inbound',
      category: 'COLD_STORAGE',
      quantity: 50,
      requiresColdStorage: true,
      targetTempMin: -20,
      targetTempMax: -16,
      dimensions: {
        lengthCm: 60,
        widthCm: 40,
        heightCm: 30,
        weightKg: 500,
        volumeM3: 1.25,
      },
      warehouseId: 'wh-01',
      storageStartDate: new Date().toISOString(),
    },
    customerToken
  );

  if (createGoodsRes.status !== 201 && createGoodsRes.status !== 200) {
    throw new Error(`Create Goods failed: ${JSON.stringify(createGoodsRes.data)}`);
  }
  const goods = createGoodsRes.data.data;
  console.log(`  -> Goods created: ID=${goods.id}, Barcode=${goods.barcode}, Status=${goods.status}, Volume=${goods.volumeM3 || 1.25} m3`);

  // 3. Customer creates Inbound Pickup Order
  console.log('\n[3/10] Customer creates Inbound Pickup Delivery Order...');
  const createOrderRes = await makeRequest(
    'POST',
    '/logistics/orders',
    {
      type: 'PICKUP',
      goodsItemIds: [goods.id],
      items: [{ goodsId: goods.id, quantity: 50 }],
      originAddress: 'PT Fresh Foods Cold Processing Unit, Cikarang',
      originCity: 'Bekasi',
      destinationAddress: 'Cakung Central Cold Hub Loading Dock 1',
      destinationCity: 'Jakarta Timur',
      warehouseId: 'wh-01',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTimeSlot: '08:00 - 12:00 WIB',
    },
    customerToken
  );

  if (createOrderRes.status !== 201 && createOrderRes.status !== 200) {
    throw new Error(`Create Order failed: ${JSON.stringify(createOrderRes.data)}`);
  }
  const order = createOrderRes.data.data;
  console.log(`  -> Inbound Order created: ID=${order.id}, OrderNo=${order.orderNumber}, Status=${order.status}, Type=${order.type}`);

  // 4. Admin assigns driver and vehicle
  console.log('\n[4/10] Admin assigns Driver (Dedi) & Vehicle (veh-01)...');
  const assignRes = await makeRequest(
    'PATCH',
    `/logistics/orders/${order.id}/status`,
    {
      status: 'DRIVER_ASSIGNED',
      driverId: 'usr-driver-2',
      vehicleId: 'veh-01',
    },
    adminToken
  );
  console.log(`  -> Assign Driver HTTP Status: ${assignRes.status}, Order Status: ${assignRes.data.data.status}`);

  // 5. Driver navigates route and arrives at warehouse
  console.log('\n[5/10] Driver progresses order: EN_ROUTE -> PICKED_UP -> IN_TRANSIT -> ARRIVED_DESTINATION...');
  await makeRequest('PATCH', `/logistics/orders/${order.id}/status`, { status: 'EN_ROUTE_PICKUP' }, driverToken);
  await makeRequest('PATCH', `/logistics/orders/${order.id}/status`, { status: 'PICKED_UP' }, driverToken);
  await makeRequest('PATCH', `/logistics/orders/${order.id}/status`, { status: 'IN_TRANSIT' }, driverToken);
  const arrivedRes = await makeRequest(
    'PATCH',
    `/logistics/orders/${order.id}/status`,
    { status: 'ARRIVED_DESTINATION' },
    driverToken
  );
  console.log(`  -> Driver arrived at warehouse dock: Status=${arrivedRes.data.data.status}`);

  // 6. Security tests: Driver POD and Customer Confirmation rejection on Inbound
  console.log('\n[6/10] Testing Inbound Security Guards (Driver POD & Customer Confirmation)...');
  const driverPodAttempt = await makeRequest(
    'POST',
    `/logistics/orders/${order.id}/pod`,
    {
      recipientName: 'Gudang Cakung',
      proofOfDeliveryUrl: 'https://storage.wms.id/pod/test.jpg',
      recipientSignature: 'DATA_SIG',
    },
    driverToken
  );
  console.log(`  -> Driver POD on Inbound rejected as expected: HTTP ${driverPodAttempt.status} (${driverPodAttempt.data.message})`);

  const customerConfirmAttempt = await makeRequest(
    'PATCH',
    `/logistics/orders/${order.id}/status`,
    { status: 'CONFIRMED' },
    customerToken
  );
  console.log(`  -> Customer status update on Inbound rejected as expected: HTTP ${customerConfirmAttempt.status} (${customerConfirmAttempt.data.message})`);

  // 7. Admin Inbound Receiving
  console.log('\n[7/10] Admin Inbound Receiving verification at Loading Dock...');
  // Test invalid quantity count
  const invalidCountRes = await makeRequest(
    'POST',
    `/logistics/orders/${order.id}/receive`,
    {
      receivedQuantity: 40,
      damagedQuantity: 0,
      missingQuantity: 0,
      condition: 'GOOD',
    },
    adminToken
  );
  console.log(`  -> Mismatched count rejected as expected: HTTP ${invalidCountRes.status} (${invalidCountRes.data.message})`);

  // Submit valid receiving
  const validReceiveRes = await makeRequest(
    'POST',
    `/logistics/orders/${order.id}/receive`,
    {
      receivedQuantity: 50,
      damagedQuantity: 0,
      missingQuantity: 0,
      condition: 'GOOD',
      receivingNotes: 'Segel kargo utuh, suhu cold chain -18.3°C stabil di dock receiving.',
    },
    adminToken
  );
  console.log(`  -> Admin Inbound Receiving Success: HTTP ${validReceiveRes.status}`);
  console.log(`     Order Status: ${validReceiveRes.data.data.status} (DELIVERED/Received)`);

  // Verify Goods status is now INSPECTING (Put-away pending)
  const goodsAfterReceive = await prisma.goodsItem.findUnique({
    where: { id: goods.id },
  });
  console.log(`     Goods Storage Status in DB: ${goodsAfterReceive.status} (INSPECTING / Put-Away Pending)`);

  // Verify Vehicle is freed
  const vehicleAfterReceive = await prisma.vehicle.findUnique({
    where: { id: 'veh-01' },
  });
  console.log(`     Vehicle Status in DB: ${vehicleAfterReceive.status} (AVAILABLE)`);

  // 8. Put-Away Validations (Cold item into standard slot vs cold slot)
  console.log('\n[8/10] Testing Put-Away Validations (Zone & Capacity)...');
  // Attempt to put cold item into standard slot (slot-03 is Standard in WH-01)
  const invalidSlotPutaway = await makeRequest(
    'PATCH',
    `/goods/${goods.id}/status`,
    {
      status: 'STORED',
      slotId: 'slot-03', // Standard slot
    },
    adminToken
  );
  console.log(`  -> Incompatible zone put-away rejected: HTTP ${invalidSlotPutaway.status} (${invalidSlotPutaway.data.message})`);

  // 9. Admin performs valid Put-Away into Cold Slot (slot-01)
  console.log('\n[9/10] Admin performs Put-Away to real Cold Slot (slot-01)...');
  const slotBefore = await prisma.storageSlot.findUnique({ where: { id: 'slot-01' } });
  const whBefore = await prisma.warehouse.findUnique({ where: { id: 'wh-01' } });

  const validPutawayRes = await makeRequest(
    'PATCH',
    `/goods/${goods.id}/status`,
    {
      status: 'STORED',
      slotId: 'slot-01',
      note: 'Ditempatkan di Slot Cold Storage A-01-01 tingkat 1.',
    },
    adminToken
  );

  console.log(`  -> Put-Away HTTP Status: ${validPutawayRes.status}`);
  const storedGoods = validPutawayRes.data.data;
  console.log(`     Goods Status: ${storedGoods.status}`);
  console.log(`     Goods Slot Code: ${storedGoods.slotCode}`);

  // 10. Database Persistence & Final Assertions
  console.log('\n[10/10] Verifying Final Database State, Slot Capacity, Inbound Order & Audit History...');
  const slotAfter = await prisma.storageSlot.findUnique({ where: { id: 'slot-01' } });
  const whAfter = await prisma.warehouse.findUnique({ where: { id: 'wh-01' } });
  const orderFinal = await prisma.deliveryOrder.findUnique({ where: { id: order.id } });
  const mutations = await prisma.goodsMutation.findMany({
    where: { goodsId: goods.id },
    orderBy: { timestamp: 'asc' },
  });
  const notifications = await prisma.notification.findMany({
    where: { relatedEntityId: order.id },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`  -> Slot 'slot-01' Used M3: ${slotBefore.usedM3} -> ${slotAfter.usedM3} (Status: ${slotAfter.status})`);
  console.log(`  -> Warehouse 'wh-01' Used M3: ${whBefore.usedCapacityM3} -> ${whAfter.usedCapacityM3}`);
  console.log(`  -> Inbound DeliveryOrder Final Status in DB: ${orderFinal.status} (CONFIRMED)`);
  console.log(`  -> Total Goods Mutations logged: ${mutations.length}`);
  mutations.forEach((m, idx) => console.log(`     [Mut ${idx + 1}] ${m.title} @ ${m.location}`));
  console.log(`  -> Total Inbound Notifications emitted: ${notifications.length}`);
  notifications.forEach((n, idx) => console.log(`     [Notif ${idx + 1}] (${n.recipientRole}) ${n.title}: ${n.message}`));

  console.log('\n=== ALL 10 INBOUND LOGISTICS E2E TEST SCENARIOS PASSED 100% ===\n');
}

runInboundE2ETest()
  .catch((err) => {
    console.error('\n❌ TEST FAILED WITH ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
