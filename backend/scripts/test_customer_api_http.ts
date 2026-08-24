async function testApi() {
  // 1. Login as Admin
  const loginRes = await fetch('http://[::1]:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@wms.id',
      password: 'Password123!',
    }),
  });

  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  const token = loginData?.data?.accessToken;
  console.log('Token exists:', !!token);

  // 2. Fetch Customers
  const custRes = await fetch('http://[::1]:5000/api/v1/users/customers', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const custData = await custRes.json();
  console.log('\nGET /api/v1/users/customers Status:', custRes.status);
  console.log('Response Structure:');
  console.log(JSON.stringify(custData, null, 2));
}

testApi().catch(console.error);
