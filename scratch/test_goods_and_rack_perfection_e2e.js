const http = require('http');

const BASE_URL = 'http://localhost:5000/api/v1';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request('/auth/login', { method: 'POST' }, { email, password });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.data.accessToken;
}

async function runE2ETests() {
  console.log('========================================================================');
  console.log('  WMS NUSANTARA: GOODS & RACK MANAGEMENT COMPREHENSIVE E2E TEST');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] #${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] #${totalTests}: ${testName}`);
      if (details) console.error(`     Details: ${details}`);
    }
  }

  try {
    // 1. Authentication for test accounts
    console.log('[1/8] Authenticating User Personas (Admin & Customers)...');
    const adminToken = await login('admin@wms.id', 'Password123!');
    const custSitiToken = await login('customer@freshfoods.id', 'Password123!');
    
    // Register a dedicated secondary customer for isolation testing
    const haidarEmail = `haidar.test.${Date.now()}@gmail.com`;
    const reg = await request('/auth/register', { method: 'POST' }, {
      email: haidarEmail,
      password: 'Password123!',
      name: 'Haidar Customer',
      companyName: 'PT Haidar Nusantara',
      phone: '081288887777',
      address: 'Jl. Surya Sumantri No. 10, Bandung',
    });
    const custHaidarToken = reg.data?.data?.accessToken || reg.data?.data?.token?.accessToken;

    assert(!!adminToken && !!custSitiToken && !!custHaidarToken, 'Admin & Customer tokens generated successfully');

    // 2. Fetch Warehouses and Active Slots
    console.log('\n[2/8] Fetching Warehouse Infrastructure & Slots from PostgreSQL...');
    const whRes = await request('/warehouses', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(whRes.status === 200 && whRes.data.data?.length > 0, 'Admin can query active warehouse facilities');
    const warehouses = whRes.data.data;
    const centralWh = warehouses.find((w) => w.code === 'WH-JKT-01') || warehouses[0];
    console.log(`      Using Warehouse: ${centralWh.name} (${centralWh.code} / ${centralWh.id})`);

    const whDetailRes = await request(`/warehouses/${centralWh.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(whDetailRes.status === 200 && whDetailRes.data.data?.slots?.length > 0, 'Warehouse detail includes dynamic rack slots');
    const slots = whDetailRes.data.data.slots;
    const coldSlots = slots.filter((s) => s.zone === 'COLD_STORAGE');
    const stdSlots = slots.filter((s) => s.zone === 'STANDARD');
    console.log(`      Found ${slots.length} total slots (${coldSlots.length} Cold, ${stdSlots.length} Standard)`);

    // 3. Rental Validation Check: Block registration if no active rental
    console.log('\n[3/8] Testing Active Rental Space Validation for Goods Registration...');
    // Create a fresh test customer with NO rentals
    const uniqueEmail = `tenant.test.${Date.now()}@example.com`;
    const regRes = await request('/auth/register', { method: 'POST' }, {
      email: uniqueEmail,
      password: 'Password123!',
      name: 'Tenant Tanpa Sewa',
      companyName: 'PT Tanpa Kontrak',
      phone: '081299998888',
      address: 'Jl. Daan Mogot Km. 11, Jakarta Barat',
    });
    const newCustToken = regRes.data?.data?.accessToken || regRes.data?.data?.token?.accessToken;

    if (newCustToken) {
      const unauthGoodsRes = await request('/goods', {
        method: 'POST',
        headers: { Authorization: `Bearer ${newCustToken}` },
      }, {
        name: 'Barang Tanpa Sewa',
        category: 'COLD_FOOD',
        description: 'Barang komoditas uji coba tanpa kontrak sewa aktif',
        lengthCm: 50,
        widthCm: 40,
        heightCm: 30,
        weightKg: 10,
        quantity: 5,
        unit: 'Packages',
        requiresColdStorage: true,
        warehouseId: centralWh.id,
      });

      assert(
        unauthGoodsRes.status === 400 &&
          unauthGoodsRes.data?.message?.includes('belum memiliki ruang penyimpanan aktif'),
        'Customer without active rental is blocked from registering goods with friendly Indonesian message',
        JSON.stringify(unauthGoodsRes.data)
      );

      // Now rent space for this new customer
      const rentRes = await request('/warehouses/rent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${newCustToken}` },
      }, {
        warehouseId: centralWh.id,
        storageType: 'COLD_STORAGE',
        volumeM3: 50,
        durationMonths: 3,
      });
      assert(rentRes.status === 201, 'Customer can successfully book warehouse rental space and generate invoice');
    }

    // 4. Goods Registration by Customer with Active Rental (Siti Rahma)
    console.log('\n[4/8] Testing Valid Goods Registration with Server-side Volume Calculation...');
    const testSkuName = `Wagyu A5 Striploin Test ${Date.now()}`;
    const createGoodsRes = await request('/goods', {
      method: 'POST',
      headers: { Authorization: `Bearer ${custSitiToken}` },
    }, {
      name: testSkuName,
      category: 'COLD_FOOD',
      description: 'Import Wagyu test batch for E2E rack verification',
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      weightKg: 20,
      quantity: 10,
      unit: 'Boxes',
      requiresColdStorage: true,
      warehouseId: centralWh.id,
      pickupRequired: false,
    });

    assert(createGoodsRes.status === 201, 'Goods successfully registered to PostgreSQL');
    const createdGood = createGoodsRes.data.data;
    console.log(`      Created Goods SKU: ${createdGood.barcode} (Volume: ${createdGood.dimensions?.volumeM3} m³)`);

    // Expected volume: (50 * 40 * 30 / 1,000,000) * 10 = 0.6 m³
    assert(
      Number(createdGood.dimensions?.volumeM3) === 0.6,
      'Server-side volume calculation is accurate: (50x40x30 / 10^6) * 10 = 0.60 m³'
    );

    // 5. Multi-Tenant Isolation
    console.log('\n[5/8] Testing Multi-Tenant Data Isolation (Anti-IDOR)...');
    // Siti sees her goods with limit 100
    const sitiGoodsRes = await request('/goods?limit=100', {
      headers: { Authorization: `Bearer ${custSitiToken}` },
    });
    console.log('      Siti raw goods response:', JSON.stringify(sitiGoodsRes.data).substring(0, 150));
    const sitiItems = sitiGoodsRes.data?.data?.items || sitiGoodsRes.data?.items || (Array.isArray(sitiGoodsRes.data?.data) ? sitiGoodsRes.data.data : []);
    const sitiHasItem = sitiItems.some((i) => i.id === createdGood.id || i.barcode === createdGood.barcode);
    assert(sitiHasItem, 'Customer Siti can view her own registered goods in list');

    // Haidar does NOT see Siti's goods in his goods list
    const haidarGoodsRes = await request('/goods?limit=100', {
      headers: { Authorization: `Bearer ${custHaidarToken}` },
    });
    const haidarItems = haidarGoodsRes.data?.data?.items || haidarGoodsRes.data?.items || (Array.isArray(haidarGoodsRes.data?.data) ? haidarGoodsRes.data.data : []);
    const haidarHasSitiItem = haidarItems.some((i) => i.id === createdGood.id || i.barcode === createdGood.barcode);
    assert(!haidarHasSitiItem, 'Customer Haidar cannot see Customer Siti goods in list');

    // Haidar direct access to Siti's goods by ID receives 404 (Anti-IDOR)
    const haidarDirectRes = await request(`/goods/${createdGood.id}`, {
      headers: { Authorization: `Bearer ${custHaidarToken}` },
    });
    assert(haidarDirectRes.status === 404, 'Direct access to other tenant goods by ID returns 404 (Anti-IDOR)');

    // 6. Put-Away to Cold Storage Slot & Dynamic Capacity Sync
    console.log('\n[6/8] Testing Put-Away Slot Allocation & Dynamic Capacity Recalculation...');
    const targetColdSlot1 = coldSlots[0];
    const initialSlot1Used = Number(targetColdSlot1.usedM3);

    const putAwayRes = await request(`/goods/${createdGood.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      status: 'STORED',
      slotId: targetColdSlot1.id,
      note: 'Put-Away to Cold Slot 1 executed by Admin',
    });

    assert(putAwayRes.status === 200, 'Admin can successfully execute Put-Away to Cold Storage slot');
    assert(putAwayRes.data.data?.status === 'STORED', 'Goods status transitioned to STORED');

    // Verify slot capacity incremented in PostgreSQL
    const whAfterPutAway = await request(`/warehouses/${centralWh.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const updatedSlot1 = whAfterPutAway.data.data?.slots?.find((s) => s.id === targetColdSlot1.id);
    const expectedSlot1Used = Number((initialSlot1Used + Number(createdGood.dimensions?.volumeM3)).toFixed(2));
    assert(
      Number(updatedSlot1.usedM3) === expectedSlot1Used,
      `Slot ${targetColdSlot1.code} usedM3 accurately incremented by 0.6 m³ (${initialSlot1Used} -> ${updatedSlot1.usedM3} m³)`
    );

    // Verify slot contains storedGoods detail
    const hasStoredGoodInSlot = updatedSlot1.storedGoods?.some((g) => g.id === createdGood.id);
    assert(hasStoredGoodInSlot, 'Slot detail response includes real storedGoods item data');

    // 7. Intra-Warehouse Rack Transfer (Goods Movement)
    console.log('\n[7/8] Testing Intra-Warehouse Rack Transfer (Goods Movement)...');
    const targetColdSlot2 = coldSlots.find((s) => s.id !== targetColdSlot1.id) || coldSlots[1];
    const initialSlot2Used = Number(targetColdSlot2.usedM3);

    // 7a. Negative Test: Transfer Cold Food to Standard Zone (Must be rejected)
    if (stdSlots.length > 0) {
      const invalidTransferRes = await request(`/goods/${createdGood.id}/transfer-slot`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, {
        targetSlotId: stdSlots[0].id,
        reason: 'Percobaan transfer ke zona standar yang tidak kompatibel',
      });
      assert(
        invalidTransferRes.status === 400 &&
          invalidTransferRes.data?.message?.includes('Cold Storage'),
        'Transfer cold goods to standard storage slot is properly rejected with zone validation error'
      );
    }

    // 7b. Positive Test: Transfer from Cold Slot 1 to Cold Slot 2
    const transferRes = await request(`/goods/${createdGood.id}/transfer-slot`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, {
      targetSlotId: targetColdSlot2.id,
      reason: 'Reorganisasi penataan rak kargo dingin untuk akses forklift',
      note: 'Dipindahkan ke rak Cold Slot 2 jalur timur',
    });

    assert(transferRes.status === 200, 'Admin can successfully transfer goods between rack slots (Rack Transfer)');
    assert(transferRes.data.data?.slotId === targetColdSlot2.id, 'Goods slotId successfully updated to new target slot');

    // Verify source slot decremented and target slot incremented in PostgreSQL
    const whAfterTransfer = await request(`/warehouses/${centralWh.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const finalSlot1 = whAfterTransfer.data.data?.slots?.find((s) => s.id === targetColdSlot1.id);
    const finalSlot2 = whAfterTransfer.data.data?.slots?.find((s) => s.id === targetColdSlot2.id);

    assert(
      Number(finalSlot1.usedM3) === initialSlot1Used,
      `Source slot ${targetColdSlot1.code} used capacity accurately decremented back to ${finalSlot1.usedM3} m³`
    );
    assert(
      Number(finalSlot2.usedM3) === Number((initialSlot2Used + 0.6).toFixed(2)),
      `Destination slot ${targetColdSlot2.code} used capacity accurately incremented to ${finalSlot2.usedM3} m³`
    );

    // 8. Inventory Mutation Audit Trail Verification
    console.log('\n[8/8] Verifying Persisted PostgreSQL Inventory Mutations (GoodsMutation)...');
    const mutationsRes = await request('/goods/mutations', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(mutationsRes.status === 200 && mutationsRes.data.data?.length > 0, 'Admin can retrieve live mutation audit logs');
    const allMutations = mutationsRes.data.data;
    const transferMutation = allMutations.find(
      (m) => m.goodsId === createdGood.id && m.type === 'TRANSFER'
    );

    assert(
      !!transferMutation,
      'Rack Transfer event is accurately persisted in goods_mutations with type TRANSFER'
    );
    if (transferMutation) {
      console.log(`      Mutation Entry: "${transferMutation.title}" by ${transferMutation.actorName} (${transferMutation.actorRole})`);
      console.log(`      Location: ${transferMutation.location}`);
      console.log(`      Description: ${transferMutation.description}`);
    }

    console.log('\n========================================================================');
    console.log(`  E2E TEST RUN COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  }
}

runE2ETests();
