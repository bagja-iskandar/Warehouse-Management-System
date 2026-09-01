const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const bcrypt = require('../backend/node_modules/bcryptjs');

async function testFullCrud() {
  const prisma = new PrismaClient();
  const testSuffix = Date.now().toString().slice(-6);

  try {
    console.log('========================================================================');
    console.log('🧪 COMPREHENSIVE PRISMA CRUD & TRANSACTION VERIFICATION (UNDER RLS)');
    console.log('========================================================================\n');

    // Clean up any test users from prior aborted runs
    await prisma.user.deleteMany({ where: { email: { contains: 'test.security' } } });

    // 1. Test User CRUD
    console.log('1. Testing User CRUD under RLS...');
    const testEmail = `test.security.${testSuffix}@wms-nusantara.id`;
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const user = await prisma.user.create({
      data: {
        id: `usr-test-${testSuffix}`,
        name: 'Test Security User',
        email: testEmail,
        passwordHash,
        phone: '081234567890',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ User INSERT: ${user.id} (${user.email})`);

    const fetchedUser = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(`✅ User SELECT: ${fetchedUser.name}`);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated Security User' },
    });
    console.log(`✅ User UPDATE: ${updatedUser.name}`);

    // 2. Test Transactional Warehouse + Zone + Slot creation
    console.log('\n2. Testing Relational Transaction (Warehouse -> Zone -> Slot)...');
    const warehouseId = `wh-test-${testSuffix}`;
    const zoneId = `zone-test-${testSuffix}`;
    const slotId = `slot-test-${testSuffix}`;

    const txResult = await prisma.$transaction(async (tx) => {
      const wh = await tx.warehouse.create({
        data: {
          id: warehouseId,
          code: `WH-TX-${testSuffix}`,
          name: 'Transaction Verification Warehouse',
          address: 'Jl. Uji Keamanan No. 1',
          city: 'Jakarta',
          totalCapacityM3: 1000,
          managerName: 'Manager Uji',
          contactPhone: '081299998888',
          isActive: false,
        },
      });

      const zone = await tx.storageZone.create({
        data: {
          id: zoneId,
          warehouseId: wh.id,
          name: 'Standard Ambient Zone',
          type: 'STANDARD',
          capacityM3: 500,
        },
      });

      const slot = await tx.storageSlot.create({
        data: {
          id: slotId,
          zoneId: zone.id,
          warehouseId: wh.id,
          code: `SL-TX-${testSuffix}`,
          zone: 'STANDARD',
          capacityM3: 10,
          status: 'AVAILABLE',
        },
      });

      return { wh, zone, slot };
    });
    console.log(`✅ Transaction CREATE (Wh: ${txResult.wh.code}, Zone: ${txResult.zone.name}, Slot: ${txResult.slot.code})`);

    // 3. Clean up test records in reverse order
    console.log('\n3. Cleaning up test records (DELETE tests)...');
    await prisma.storageSlot.delete({ where: { id: slotId } });
    console.log(`✅ Slot DELETE: ${slotId}`);

    await prisma.storageZone.delete({ where: { id: zoneId } });
    console.log(`✅ Zone DELETE: ${zoneId}`);

    await prisma.warehouse.delete({ where: { id: warehouseId } });
    console.log(`✅ Warehouse DELETE: ${warehouseId}`);

    await prisma.user.delete({ where: { id: user.id } });
    console.log(`✅ User DELETE: ${user.id}`);

    console.log('\n========================================================================');
    console.log('🎉 ALL PRISMA CRUD & TRANSACTION OPERATIONS VERIFIED 100% OPERATIONAL!');
    console.log('========================================================================\n');
  } catch (error) {
    console.error('❌ CRUD Verification failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFullCrud();
