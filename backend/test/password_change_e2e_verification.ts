import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

async function runComprehensivePasswordTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E2E PASSWORD CHANGE & AUTH TEST SUITE');
  console.log('===============================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] Test ${totalTests}: ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Initial Login with standard baseline password
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 1: ADMIN PASSWORD CHANGE & LOGIN LIFECYCLE ---');
  const adminEmail = 'admin@wms.id';
  const initialPassword = 'Password123!';
  const newPassword = 'SecureAdminPass2026!';

  // Reset to initial baseline first
  const initialHash = await bcrypt.hash(initialPassword, 10);
  await prisma.user.update({
    where: { email: adminEmail },
    data: { passwordHash: initialHash },
  });

  const adminBefore = await prisma.user.findUnique({ where: { email: adminEmail } });
  const hash_A = adminBefore?.passwordHash || '';

  const loginRes1 = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: initialPassword }),
  });
  const loginData1 = await loginRes1.json();
  assert(
    loginRes1.status === 200,
    'Login with old password before change succeeds',
    `Token received for ${adminEmail}`,
  );

  const accessToken1 = loginData1.data?.accessToken;
  const adminId = loginData1.data?.user?.id;

  // --------------------------------------------------------------------------
  // TEST 2: Attempt Change Password with Invalid Current Password -> MUST FAIL (401)
  // --------------------------------------------------------------------------
  const wrongPassRes = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken1}`,
    },
    body: JSON.stringify({
      currentPassword: 'WrongPassword999!',
      newPassword: newPassword,
    }),
  });
  assert(
    wrongPassRes.status === 401,
    'Change password with incorrect current password fails (401 Unauthorized)',
  );

  // --------------------------------------------------------------------------
  // TEST 3: Attempt Change Password where new === current -> MUST FAIL (400)
  // --------------------------------------------------------------------------
  const samePassRes = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken1}`,
    },
    body: JSON.stringify({
      currentPassword: initialPassword,
      newPassword: initialPassword,
    }),
  });
  assert(
    samePassRes.status === 400,
    'Change password to the exact same password fails (400 Bad Request)',
  );

  // --------------------------------------------------------------------------
  // TEST 4: Perform Valid Change Password -> SUCCESS (200)
  // --------------------------------------------------------------------------
  const validChangeRes = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken1}`,
    },
    body: JSON.stringify({
      currentPassword: initialPassword,
      newPassword: newPassword,
    }),
  });
  const validChangeData = await validChangeRes.json();
  assert(
    validChangeRes.status === 200 && validChangeData.data?.success === true,
    'Change password with valid credentials succeeds (200 OK)',
  );

  // --------------------------------------------------------------------------
  // TEST 5: Verify Database Persistence & Cryptographic Hash in PostgreSQL
  // --------------------------------------------------------------------------
  const adminAfter = await prisma.user.findUnique({ where: { email: adminEmail } });
  const hash_B = adminAfter?.passwordHash || '';

  assert(hash_A !== hash_B, 'PostgreSQL passwordHash has been modified', `Hash A != Hash B`);
  const verifyNew = await bcrypt.compare(newPassword, hash_B);
  assert(verifyNew === true, 'New password verifies successfully against new database hash');
  const verifyOld = await bcrypt.compare(initialPassword, hash_B);
  assert(verifyOld === false, 'Old password fails verification against new database hash');

  // --------------------------------------------------------------------------
  // TEST 6: Login using OLD password -> MUST FAIL (401)
  // --------------------------------------------------------------------------
  const oldLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: initialPassword }),
  });
  assert(oldLoginRes.status === 401, 'Login using OLD password fails with 401 Unauthorized');

  // --------------------------------------------------------------------------
  // TEST 7: Login using NEW password -> MUST SUCCEED (200)
  // --------------------------------------------------------------------------
  const newLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: newPassword }),
  });
  const newLoginData = await newLoginRes.json();
  assert(
    newLoginRes.status === 200,
    'Login using NEW password succeeds with 200 OK',
    `New session issued for ${adminEmail}`,
  );

  // --------------------------------------------------------------------------
  // TEST 8: Anti-IDOR Authorization Check (User cannot modify another user password)
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 2: SECURITY & AUTHORIZATION BOUNDARY ---');
  // Attempt to pass another user's ID in body to change-password
  // Because the endpoint extracts userId from @CurrentUser('id') (JWT claims), body manipulation has no effect
  const customerEmail = 'haidar@gmail.com';
  const customerBefore = await prisma.user.findUnique({ where: { email: customerEmail } });
  const custHashBefore = customerBefore?.passwordHash;

  // Admin tries calling change-password with body containing customer's userId
  const maliciousRes = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newLoginData.data?.accessToken}`,
    },
    body: JSON.stringify({
      userId: customerBefore?.id,
      currentPassword: newPassword, // Admin's password
      newPassword: 'HackedCustomerPass2026!',
    }),
  });
  // This changes ADMIN's password (the authenticated user), NOT the customer's password!
  const customerAfter = await prisma.user.findUnique({ where: { email: customerEmail } });
  assert(
    customerAfter?.passwordHash === custHashBefore,
    'Target user password remains completely untouched by IDOR payload',
  );

  // --------------------------------------------------------------------------
  // TEST 9: Multi-Role Verification (Customer role password change)
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 3: MULTI-ROLE COVERAGE (CUSTOMER & DRIVER) ---');
  // 1. Customer Login
  const custLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerEmail, password: 'Password123!' }),
  });
  const custLoginData = await custLoginRes.json();
  assert(custLoginRes.status === 200, 'Customer login succeeds');

  const custToken = custLoginData.data?.accessToken;
  const custNewPass = 'FreshFoodNewPass2026!';

  // 2. Customer Change Password
  const custChangeRes = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
    },
    body: JSON.stringify({
      currentPassword: 'Password123!',
      newPassword: custNewPass,
    }),
  });
  assert(custChangeRes.status === 200, 'Customer changes password successfully');

  // 3. Customer Login with new pass
  const custNewLogin = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerEmail, password: custNewPass }),
  });
  assert(custNewLogin.status === 200, 'Customer login with NEW password succeeds');

  // 4. Customer Login with old pass -> MUST FAIL
  const custOldLogin = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerEmail, password: 'Password123!' }),
  });
  assert(custOldLogin.status === 401, 'Customer login with OLD password fails (401)');

  // --------------------------------------------------------------------------
  // TEST 10: Multi-Role Verification (Driver role password change)
  // --------------------------------------------------------------------------
  const driverEmail = 'driver@wms.id';
  const driverLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: driverEmail, password: 'Password123!' }),
  });
  const driverLoginData = await driverLoginRes.json();
  assert(driverLoginRes.status === 200, 'Driver login succeeds');

  const driverToken = driverLoginData.data?.accessToken;
  const driverNewPass = 'LogisticsFleetPass2026!';

  const driverChangeRes = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`,
    },
    body: JSON.stringify({
      currentPassword: 'Password123!',
      newPassword: driverNewPass,
    }),
  });
  assert(driverChangeRes.status === 200, 'Driver changes password successfully');

  const driverNewLogin = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: driverEmail, password: driverNewPass }),
  });
  assert(driverNewLogin.status === 200, 'Driver login with NEW password succeeds');

  const driverOldLogin = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: driverEmail, password: 'Password123!' }),
  });
  assert(driverOldLogin.status === 401, 'Driver login with OLD password fails (401)');

  // --------------------------------------------------------------------------
  // TEST 11: Cleanup and reset baseline passwords for Admin, Customer, and Driver
  // --------------------------------------------------------------------------
  console.log('\n--- PHASE 4: CLEANUP & BASELINE PRESERVATION ---');
  const standardHash = await bcrypt.hash('Password123!', 10);
  await prisma.user.updateMany({
    where: {
      email: { in: [adminEmail, customerEmail, driverEmail] },
    },
    data: { passwordHash: standardHash },
  });

  const finalAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const finalCheck = await bcrypt.compare('Password123!', finalAdmin?.passwordHash || '');
  assert(
    finalCheck === true,
    'Baseline Admin password restored to "Password123!" for manual QA testing',
  );

  console.log('===============================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED PERFECTLY!`);
  console.log('===============================================================');
}

runComprehensivePasswordTests()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
