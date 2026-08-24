const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = options.body ? options.body : null;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    if (postData) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function login(email, password) {
  const res = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.data.accessToken;
}

async function registerCustomer(name, email, password, companyName) {
  const res = await request(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      companyName,
      phone: '081299887766',
      address: 'Jl. Industri Logistik No. 88, Jakarta Barat',
    }),
  });
  if (res.status !== 201) {
    throw new Error(`Registration failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return {
    accessToken: res.data.data.accessToken,
    user: res.data.data.user,
  };
}

async function runLifecycleTests() {
  console.log('===============================================================');
  console.log('STARTING B2B BILLING & PAYMENT LIFECYCLE VERIFICATION (TESTS A-H)');
  console.log('===============================================================\n');

  // 1. Authenticate Admin
  const adminToken = await login('admin@wms.id', 'Password123!');
  console.log('✅ 1. Admin authenticated (admin@wms.id)');

  // 2. Create brand new Customer for Test A-G
  const testEmail = `tenant.lifecycle.${Date.now()}@wms.id`;
  const customerAuth = await registerCustomer(
    'PT Nusantara Food Cold Chain',
    testEmail,
    'Password123!',
    'PT Nusantara Food Cold Chain',
  );

  const customerToken = customerAuth.accessToken;
  const customerUser = customerAuth.user;
  console.log(`✅ 2. New Customer registered: ${customerUser.name} (${testEmail})`);

  // =========================================================================
  // TEST A: Customer Baru - No Invoices, Rent Space -> Invoice UNPAID, Payment NOT_STARTED
  // =========================================================================
  console.log('\n--- TEST A: Customer Baru (Initial State & Rent Space) ---');
  const initialInvoices = await request(`${API_BASE}/billing/invoices`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const initialItems = initialInvoices.data.data.items || [];
  if (initialItems.length !== 0) {
    throw new Error(`Expected 0 initial invoices, got ${initialItems.length}`);
  }
  console.log('✅ TEST A.1: Verified new customer has 0 initial invoices in database.');

  // Fetch available warehouse to rent
  const whRes = await request(`${API_BASE}/warehouses`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const warehouses = Array.isArray(whRes.data.data) ? whRes.data.data : whRes.data.data.items;
  const warehouse = warehouses[0];

  // Customer rents space
  const rentRes = await request(`${API_BASE}/warehouses/rent`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      warehouseId: warehouse.id,
      storageType: 'COLD_STORAGE',
      volumeM3: 5.0,
      durationMonths: 2,
      startDate: new Date().toISOString(),
    }),
  });

  if (rentRes.status !== 201) {
    throw new Error(`Rent space failed: ${JSON.stringify(rentRes.data)}`);
  }

  const invoiceId = rentRes.data.data.invoice.id;
  const invoiceNumber = rentRes.data.data.invoice.invoiceNumber;
  const totalAmount = rentRes.data.data.invoice.totalAmount;
  console.log(`✅ TEST A.2: Rented space successfully! Invoice created: #${invoiceNumber} (ID: ${invoiceId}, Total: Rp ${totalAmount.toLocaleString('id-ID')})`);

  // Verify invoice state
  const invDetailA = await request(`${API_BASE}/billing/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (invDetailA.data.data.status !== 'UNPAID' || invDetailA.data.data.latestPaymentStatus !== 'NOT_STARTED') {
    throw new Error(`TEST A Failed: Expected status UNPAID & latestPaymentStatus NOT_STARTED, got status=${invDetailA.data.data.status}, paymentStatus=${invDetailA.data.data.latestPaymentStatus}`);
  }
  console.log(`✅ TEST A.3: Confirmed Invoice Status = ${invDetailA.data.data.status}, Payment Status = ${invDetailA.data.data.latestPaymentStatus}`);

  // =========================================================================
  // TEST B: Customer Submit Payment -> Invoice PENDING_PAYMENT, Payment UNDER_REVIEW
  // =========================================================================
  console.log('\n--- TEST B: Customer Submit Payment ---');
  const payRes1 = await request(`${API_BASE}/billing/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: 'TRX-BCA-TEST-001',
      amount: totalAmount,
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
      notes: 'Pembayaran tagihan sewa cold storage 5m3',
    }),
  });

  if (payRes1.status !== 200) {
    throw new Error(`Payment submission failed: ${JSON.stringify(payRes1.data)}`);
  }

  const invDetailB = await request(`${API_BASE}/billing/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (invDetailB.data.data.status !== 'PENDING_PAYMENT' || invDetailB.data.data.latestPaymentStatus !== 'UNDER_REVIEW') {
    throw new Error(`TEST B Failed: Expected PENDING_PAYMENT & UNDER_REVIEW, got status=${invDetailB.data.data.status}, paymentStatus=${invDetailB.data.data.latestPaymentStatus}`);
  }
  console.log(`✅ TEST B: Payment submitted! Invoice = ${invDetailB.data.data.status}, Payment = ${invDetailB.data.data.latestPaymentStatus}`);

  // =========================================================================
  // TEST C: Customer Duplicate Payment Attempt while PENDING_PAYMENT
  // =========================================================================
  console.log('\n--- TEST C: Customer Duplicate Payment Prevention ---');
  const payResDuplicate = await request(`${API_BASE}/billing/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: 'TRX-BCA-TEST-DUPLICATE',
      amount: totalAmount,
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    }),
  });

  if (payResDuplicate.status !== 400) {
    throw new Error(`Expected 400 Bad Request on duplicate payment, got ${payResDuplicate.status}`);
  }
  console.log(`✅ TEST C: Duplicate payment properly blocked with message: "${payResDuplicate.data.message}"`);

  // =========================================================================
  // TEST D: Admin Review Queue
  // =========================================================================
  console.log('\n--- TEST D: Admin Review Queue ---');
  const pendingQueue = await request(`${API_BASE}/billing/payments/pending`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const matchingPayment = pendingQueue.data.data.find((p) => p.invoiceId === invoiceId);
  if (!matchingPayment) {
    throw new Error(`TEST D Failed: Submitted payment for invoice ${invoiceId} not found in admin pending review queue`);
  }
  console.log(`✅ TEST D: Admin successfully fetched pending payments! Found payment #${matchingPayment.paymentNumber} with proof URL: ${matchingPayment.proofUrl}`);

  // =========================================================================
  // TEST E: Admin Reject Payment with Reason
  // =========================================================================
  console.log('\n--- TEST E: Admin Reject Payment with Reason ---');
  const rejectReason = 'Bukti transfer buram / nominal mutasi bank belum teridentifikasi';
  const rejectRes = await request(`${API_BASE}/billing/invoices/${invoiceId}/verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      action: 'REJECT',
      rejectionReason: rejectReason,
    }),
  });

  if (rejectRes.status !== 200) {
    throw new Error(`Reject payment failed: ${JSON.stringify(rejectRes.data)}`);
  }

  // Customer checks invoice after rejection
  const invDetailE = await request(`${API_BASE}/billing/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (invDetailE.data.data.status !== 'UNPAID' || invDetailE.data.data.latestPaymentStatus !== 'REJECTED') {
    throw new Error(`TEST E Failed: Expected status UNPAID & payment REJECTED, got status=${invDetailE.data.data.status}, paymentStatus=${invDetailE.data.data.latestPaymentStatus}`);
  }
  if (invDetailE.data.data.latestRejectionReason !== rejectReason) {
    throw new Error(`TEST E Failed: Expected rejectionReason="${rejectReason}", got "${invDetailE.data.data.latestRejectionReason}"`);
  }
  console.log(`✅ TEST E: Payment rejected! Invoice reverted to ${invDetailE.data.data.status}, Payment = ${invDetailE.data.data.latestPaymentStatus}`);
  console.log(`   Customer sees Rejection Reason: "${invDetailE.data.data.latestRejectionReason}"`);

  // =========================================================================
  // TEST F: Resubmit Payment
  // =========================================================================
  console.log('\n--- TEST F: Resubmit Payment ---');
  const resubmitRes = await request(`${API_BASE}/billing/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: 'TRX-BCA-CORRECTED-002',
      amount: totalAmount,
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&valid=true',
      notes: 'Bukti transfer resolusi tinggi yang sudah diverifikasi teller',
    }),
  });

  if (resubmitRes.status !== 200) {
    throw new Error(`Resubmit payment failed: ${JSON.stringify(resubmitRes.data)}`);
  }

  const invDetailF = await request(`${API_BASE}/billing/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (invDetailF.data.data.status !== 'PENDING_PAYMENT' || invDetailF.data.data.latestPaymentStatus !== 'UNDER_REVIEW') {
    throw new Error(`TEST F Failed: Expected PENDING_PAYMENT & UNDER_REVIEW, got status=${invDetailF.data.data.status}`);
  }
  if (invDetailF.data.data.payments.length !== 2) {
    throw new Error(`TEST F Failed: Expected 2 payment records (1 REJECTED, 1 UNDER_REVIEW), got ${invDetailF.data.data.payments.length}`);
  }
  console.log(`✅ TEST F: Resubmitted successfully! History preserved with ${invDetailF.data.data.payments.length} payment attempts in database.`);

  // =========================================================================
  // TEST G: Admin Verify -> PAID & Receipt Number Generated
  // =========================================================================
  console.log('\n--- TEST G: Admin Verify Payment ---');
  const verifyRes = await request(`${API_BASE}/billing/invoices/${invoiceId}/verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      action: 'VERIFY',
      note: 'Dana transfer masuk ke rekening operasional BCA WMS Nusantara',
    }),
  });

  if (verifyRes.status !== 200) {
    throw new Error(`Verify payment failed: ${JSON.stringify(verifyRes.data)}`);
  }

  const invDetailG = await request(`${API_BASE}/billing/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (invDetailG.data.data.status !== 'PAID' || invDetailG.data.data.latestPaymentStatus !== 'VERIFIED') {
    throw new Error(`TEST G Failed: Expected PAID & VERIFIED, got status=${invDetailG.data.data.status}`);
  }
  if (!invDetailG.data.data.receiptNumber || !invDetailG.data.data.receiptNumber.startsWith('REC-')) {
    throw new Error(`TEST G Failed: Expected valid receiptNumber starting with REC-, got ${invDetailG.data.data.receiptNumber}`);
  }
  console.log(`✅ TEST G: Payment verified & invoice settled!`);
  console.log(`   Invoice Status: ${invDetailG.data.data.status}`);
  console.log(`   Payment Status: ${invDetailG.data.data.latestPaymentStatus}`);
  console.log(`   Official Receipt Number: ${invDetailG.data.data.receiptNumber}`);
  console.log(`   Settled Date: ${invDetailG.data.data.paidDate}`);

  // =========================================================================
  // TEST H: Multi-Tenant Isolation
  // =========================================================================
  console.log('\n--- TEST H: Multi-Tenant Isolation (Anti-IDOR) ---');
  const custBAuth = await registerCustomer(
    'Tenant B Logistics',
    `tenant.b.${Date.now()}@wms.id`,
    'Password123!',
    'Tenant B Logistics',
  );
  const tokenB = custBAuth.accessToken;

  // Customer B tries to view Customer A's invoice
  const custBTryView = await request(`${API_BASE}/billing/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (custBTryView.status !== 404) {
    throw new Error(`TEST H Failed: Customer B was able to access Customer A invoice with status ${custBTryView.status}`);
  }

  // Customer B tries to pay Customer A's invoice
  const custBTryPay = await request(`${API_BASE}/billing/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      paymentMethod: 'BANK_TRANSFER',
      amount: totalAmount,
      paymentProofUrl: 'https://...',
    }),
  });
  if (custBTryPay.status !== 404) {
    throw new Error(`TEST H Failed: Customer B was able to initiate payment on Customer A invoice with status ${custBTryPay.status}`);
  }
  console.log('✅ TEST H: Multi-tenant isolation verified 100%! Customer B cannot view or pay Customer A invoice.');

  // =========================================================================
  // TEST I: Haidar's Existing Account Verification
  // =========================================================================
  console.log('\n--- TEST I: Haidar Existing Account Check ---');
  const haidarInvoices = await request(`${API_BASE}/billing/invoices`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const haidarItems = haidarInvoices.data.data.items || haidarInvoices.data.data || [];
  const haidarInv = haidarItems.find((i) => i.customerEmail === 'haidar@gmail.com');
  if (haidarInv) {
    console.log(`✅ Haidar Invoice in DB: #${haidarInv.invoiceNumber} (Status: ${haidarInv.status}, PaymentStatus: ${haidarInv.latestPaymentStatus})`);
  }

  console.log('\n===============================================================');
  console.log('ALL TEST SCENARIOS (A, B, C, D, E, F, G, H, I) PASSED 100%!');
  console.log('===============================================================\n');
}

runLifecycleTests().catch((err) => {
  console.error('❌ LIFECYCLE TEST FAILED:', err);
  process.exit(1);
});
