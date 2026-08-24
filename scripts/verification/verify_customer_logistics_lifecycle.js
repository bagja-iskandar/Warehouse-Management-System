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

async function login(email, password) {
  const res = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email, password },
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.data.accessToken;
}

async function main() {
  console.log('=== STARTING LOGISTICS & RECEIVING LIFECYCLE TEST ===\n');

  console.log('1. Logging in as Admin, Customer (Haidar), and Driver...');
  const adminToken = await login('admin@wms.id', 'Password123!');
  const customerToken = await login('haidar@customer.wms.id', 'Password123!');
  const driverToken = await login('driver@wms.id', 'Password123!');
  console.log('   -> Logged in successfully.\n');

  console.log('2. Fetching Customer Goods & Active Warehouses...');
  const goodsRes = await request(`${API_BASE}/goods`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const items = goodsRes.data.data.items || [];
  console.log(`   -> Customer has ${items.length} goods items.`);
  if (items.length === 0) {
    throw new Error('No goods items found for customer.');
  }
  const testGoods = items[0];
  console.log(`   -> Target goods item: ${testGoods.name} (ID: ${testGoods.id}, Qty: ${testGoods.quantity})`);

  const whRes = await request(`${API_BASE}/warehouses`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const warehouses = whRes.data.data.items || [];
  const targetWh = warehouses[0];
  console.log(`   -> Target warehouse: ${targetWh.name} (ID: ${targetWh.id})\n`);

  console.log('3. Submitting Inbound Logistics Request (Customer)...');
  const createOrderRes = await request(`${API_BASE}/logistics/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      type: 'INBOUND_PICKUP',
      warehouseId: targetWh.id,
      pickupAddress: 'Jl. Merdeka No. 100, Jakarta Pusat',
      deliveryAddress: targetWh.address,
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      cargoDescription: `Inbound shipment for ${testGoods.name}`,
      items: [
        {
          goodsId: testGoods.id,
          quantity: 10,
          packageCount: 5,
          unit: testGoods.unit || 'Box',
          notes: 'Test inbound manifest',
        },
      ],
    },
  });
  console.log(`   -> Status: ${createOrderRes.status}`);
  if (createOrderRes.status !== 201) {
    throw new Error(`Create order failed: ${JSON.stringify(createOrderRes.data)}`);
  }
  const createdOrder = createOrderRes.data.data;
  console.log(`   -> Created Order Number: ${createdOrder.orderNumber} (ID: ${createdOrder.id})\n`);

  console.log('4. Admin assigns Driver & Vehicle...');
  const vehiclesRes = await request(`${API_BASE}/logistics/vehicles`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const vehicles = vehiclesRes.data.data.items || vehiclesRes.data.data || [];
  const targetVehicle = vehicles[0];

  const updateOrderRes = await request(`${API_BASE}/logistics/orders/${createdOrder.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      status: 'DRIVER_ASSIGNED',
      driverId: 'usr-driver-001',
      vehicleId: targetVehicle.id,
    },
  });
  console.log(`   -> Status: ${updateOrderRes.status}`);

  console.log('5. Driver starts route (EN_ROUTE -> PICKED_UP -> IN_TRANSIT)...');
  await request(`${API_BASE}/logistics/orders/${createdOrder.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: { status: 'EN_ROUTE' },
  });
  await request(`${API_BASE}/logistics/orders/${createdOrder.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: { status: 'PICKED_UP' },
  });
  await request(`${API_BASE}/logistics/orders/${createdOrder.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: { status: 'IN_TRANSIT' },
  });
  console.log('   -> Order transitioned to IN_TRANSIT.\n');

  console.log('6. Driver submits POD and marks ARRIVED...');
  const podRes = await request(`${API_BASE}/logistics/orders/${createdOrder.id}/pod`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: {
      photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
      signatureUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
      recipientName: 'Budi Warehouse Receiver',
      notes: 'Driver handed over cargo at dock A',
    },
  });
  console.log(`   -> POD submission status: ${podRes.status}`);

  console.log('7. Warehouse Admin confirms Dock Receiving...');
  const receiveRes = await request(`${API_BASE}/logistics/orders/${createdOrder.id}/receive`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      dockNumber: 'DOCK-01',
      condition: 'GOOD',
      receivedQuantity: 10,
      notes: 'Receiving inspection passed 100%',
    },
  });
  console.log(`   -> Receive status: ${receiveRes.status}`);

  console.log('\n=== LOGISTICS & RECEIVING LIFECYCLE TEST COMPLETED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
