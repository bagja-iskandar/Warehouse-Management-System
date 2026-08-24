import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../src/modules/users/users.service';
import { AuthenticatedUser } from '../src/modules/auth/interfaces/jwt-payload.interface';

const prisma = new PrismaClient();

async function runVerification() {
  console.log('================================================================');
  console.log('   CUSTOMER CRUD & HAIDAR INTEGRITY VERIFICATION SUITE          ');
  console.log('================================================================\n');

  const usersService = new UsersService(prisma as any);

  const adminRecord = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });
  if (!adminRecord) throw new Error('Admin user not found');

  const adminUser: AuthenticatedUser = {
    id: adminRecord.id,
    email: adminRecord.email,
    role: UserRole.ADMIN,
    name: adminRecord.name,
    phone: adminRecord.phone,
    status: adminRecord.status,
  };

  // 1. Haidar Account Integrity
  console.log('--- 1. VERIFYING HAIDAR ACCOUNT INTEGRITY ---');
  const haidar = await prisma.user.findFirst({
    where: { email: 'haidar@gmail.com' },
    include: {
      goodsItems: { include: { slot: true, warehouse: true } },
      customerInvoices: true,
    },
  });

  if (!haidar) throw new Error('Haidar account missing from DB!');
  console.log(`✅ Haidar Account Found: "${haidar.name}" (${haidar.email})`);
  console.log(`   - ID: ${haidar.id}`);
  console.log(`   - Status: ${haidar.status}`);
  console.log(`   - Company: ${haidar.companyName}`);

  // Check Haidar's Goods
  if (haidar.goodsItems.length !== 1) {
    throw new Error(`Expected 1 goods for Haidar, found ${haidar.goodsItems.length}`);
  }
  const haidarGood = haidar.goodsItems[0];
  console.log(`✅ Haidar Goods Verified: "${haidarGood.name}" (SKU: ${haidarGood.barcode})`);
  console.log(`   - Status: ${haidarGood.status}`);
  console.log(`   - Volume: ${haidarGood.volumeM3} m³`);
  console.log(`   - Slot: ${haidarGood.slot?.code}`);
  console.log(`   - Warehouse: ${haidarGood.warehouse.name}`);

  // Check Haidar's Invoice
  if (haidar.customerInvoices.length !== 1) {
    throw new Error(`Expected 1 invoice for Haidar, found ${haidar.customerInvoices.length}`);
  }
  const haidarInv = haidar.customerInvoices[0];
  console.log(`✅ Haidar Invoice Verified: #${haidarInv.invoiceNumber}`);
  console.log(`   - Total: Rp ${haidarInv.totalAmount}`);
  console.log(`   - Status: ${haidarInv.status}\n`);

  // 2. Test Customer Directory Listing API
  console.log('--- 2. TESTING CUSTOMER DIRECTORY LISTING API ---');
  const customerList = await usersService.findCustomers(adminUser);
  console.log(`✅ findCustomers API returned ${customerList.length} customer(s).`);
  console.log(`   - First Customer: "${customerList[0].name}" (${customerList[0].email})`);
  console.log(`   - Stored Goods Count: ${customerList[0].storedGoodsCount}`);
  console.log(`   - Total Volume: ${customerList[0].totalVolumeM3} m³`);
  console.log(`   - Total Billed: Rp ${customerList[0].totalBilledAmount}\n`);

  if (customerList.length !== 1 || customerList[0].email !== 'haidar@gmail.com') {
    throw new Error('Customer list should only contain 1 customer (Haidar).');
  }

  // 3. Test Customer Create -> Update -> Delete Flow
  console.log('--- 3. TESTING CUSTOMER UPDATE & DELETE FLOW ---');
  // Create a temporary test customer
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);
  const testCustomer = await prisma.user.create({
    data: {
      name: 'Temp Test Tenant',
      email: 'temp.test.tenant@wmsnutantara.id',
      passwordHash,
      role: UserRole.CUSTOMER,
      phone: '081233445566',
      companyName: 'PT Temp Test Corporation',
      address: 'Jl. Uji Coba No. 10, Bandung',
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`✅ Created Test Customer: "${testCustomer.name}" (${testCustomer.email}) [ID: ${testCustomer.id}]`);

  // Update Test Customer
  const updatedCustomer = await usersService.updateUser(
    testCustomer.id,
    {
      name: 'Temp Test Tenant Updated',
      companyName: 'PT Temp Test Corporation Tbk',
      phone: '081299998888',
      status: UserStatus.SUSPENDED,
    },
    adminUser,
  );
  console.log(`✅ Updated Test Customer: Name="${updatedCustomer.name}", Company="${updatedCustomer.companyName}", Status=${updatedCustomer.status}`);

  if (updatedCustomer.name !== 'Temp Test Tenant Updated' || updatedCustomer.status !== UserStatus.SUSPENDED) {
    throw new Error('Update customer failed to persist changes!');
  }

  // Delete Test Customer
  const deleteResult = await usersService.deleteUser(testCustomer.id, adminUser);
  console.log(`✅ Deleted Test Customer: ${deleteResult.message}`);

  const checkDeleted = await prisma.user.findUnique({
    where: { id: testCustomer.id },
  });
  if (checkDeleted) {
    throw new Error('Customer was not deleted from database!');
  }
  console.log('✅ Confirmed Test Customer is completely removed from PostgreSQL.\n');

  // 4. Warehouse and Slot Capacity Sanity Check
  console.log('--- 4. WAREHOUSE & SLOT CAPACITY CHECK ---');
  const warehouse = await prisma.warehouse.findUnique({
    where: { code: 'WH-CKG-01' },
    include: { slots: true },
  });
  if (!warehouse) throw new Error('Warehouse WH-CKG-01 not found');

  const slotF01 = warehouse.slots.find((s) => s.code === 'RAK-F01')!;
  console.log(`Warehouse Used Capacity: ${warehouse.usedCapacityM3} / ${warehouse.totalCapacityM3} m³ (Expected: 6 / 5000 m³)`);
  console.log(`Slot RAK-F01 Used Volume: ${slotF01.usedM3} / ${slotF01.capacityM3} m³ (Expected: 6 / 200 m³)`);

  if (Number(warehouse.usedCapacityM3) !== 6 || Number(slotF01.usedM3) !== 6) {
    throw new Error(`Capacity mismatch! Expected 6 m3 in WH-CKG-01 and RAK-F01.`);
  }

  console.log('\n================================================================');
  console.log('   🎉 ALL CUSTOMER CRUD & INTEGRITY CHECKS PASSED WITH 100% SUCCESS');
  console.log('================================================================');
}

runVerification()
  .catch((e) => {
    console.error('VERIFICATION FAILED:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
