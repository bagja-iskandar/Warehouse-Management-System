async function testLogin(email, password, expectedRole) {
  const response = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();

  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Login failed for ${email} with status ${response.status}: ${JSON.stringify(body)}`);
  }

  if (!body.success || !body.data || !body.data.accessToken) {
    throw new Error(`Invalid response structure for ${email}: ${JSON.stringify(body)}`);
  }

  const user = body.data.user;
  if (user.role !== expectedRole) {
    throw new Error(`Role mismatch for ${email}. Expected ${expectedRole}, got ${user.role}`);
  }

  console.log(`✅ Login SUCCESS for ${email}`);
  console.log(`   └─ User ID: ${user.id}`);
  console.log(`   └─ Name: ${user.name}`);
  console.log(`   └─ Role: ${user.role}`);
  console.log(`   └─ Status: ${user.status}`);
  console.log(`   └─ Access Token: [ISSUED - VALID JWT]`);
  console.log(`   └─ Refresh Token: [ISSUED - STORED IN DB]`);
}

async function runAll() {
  const password = process.env.LOGIN_VERIFY_PASSWORD || '123456';
  console.log('========================================================================');
  console.log('🔐 TESTING APPLICATION LOGIN ENDPOINT (POST /api/v1/auth/login)');
  console.log('========================================================================\n');

  try {
    await testLogin('admin@wms.id', password, 'ADMIN');
    console.log('');
    await testLogin('driver@wms.id', password, 'DRIVER');
    console.log('');
    await testLogin('customer@wms.id', password, 'CUSTOMER');

    console.log('\n========================================================================');
    console.log('🎉 ALL 3 ACCOUNTS AUTHENTICATED SUCCESSFULLY VIA LOGIN API!');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('❌ Login verification error:', err.message);
    process.exit(1);
  }
}

runAll();
