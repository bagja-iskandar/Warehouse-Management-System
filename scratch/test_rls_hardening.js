const { PrismaClient } = require('../backend/node_modules/@prisma/client');

async function testRlsHardening() {
  const prisma = new PrismaClient();
  try {
    console.log('========================================================================');
    console.log('🧪 TESTING RLS HARDENING BEHAVIOR WITH PRISMA CONNECTION');
    console.log('========================================================================\n');

    // 1. Check current user and bypassrls attribute in pg_roles
    const roleInfo = await prisma.$queryRaw`
      SELECT rolname, rolsuper, rolbypassrls, rolinherit 
      FROM pg_roles 
      WHERE rolname = current_user;
    `;
    console.log('1. CURRENT DB ROLE CAPABILITIES:');
    console.table(roleInfo);

    // 2. Test enabling RLS on all 17 public tables
    const tableNames = [
      '_prisma_migrations',
      'audit_logs',
      'delivery_orders',
      'goods_items',
      'goods_mutations',
      'invoice_items',
      'invoices',
      'order_items',
      'payments',
      'refresh_tokens',
      'storage_slots',
      'storage_zones',
      'system_notifications',
      'telemetry_logs',
      'users',
      'vehicles',
      'warehouses'
    ];

    console.log('2. ENABLING RLS ON ALL TABLES...');
    for (const table of tableNames) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "public"."${table}" ENABLE ROW LEVEL SECURITY;`);
    }
    console.log('✅ RLS successfully enabled on all 17 tables.');

    // 3. Revoke all privileges from anon and authenticated roles
    console.log('\n3. REVOKING ALL PRIVILEGES ON PUBLIC TABLES FROM anon AND authenticated...');
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;`);
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;`);
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;`);
    console.log('✅ Revoked permissions for anon and authenticated.');

    // 4. Test Prisma CRUD capabilities on an RLS-enabled table
    console.log('\n4. VERIFYING PRISMA CRUD CAPABILITIES ON RLS-ENABLED TABLE (warehouses)...');

    // Test INSERT
    const testWhId = 'wh-security-test-' + Date.now();
    const createdWh = await prisma.warehouse.create({
      data: {
        id: testWhId,
        code: 'WH-TEST-' + Math.floor(Math.random() * 10000),
        name: 'Hardening Audit Temporary Test Warehouse',
        address: 'Testing Grounds, Jakarta',
        city: 'Jakarta',
        totalCapacityM3: 500,
        managerName: 'Security Audit Manager',
        contactPhone: '08123456789',
        isActive: false,
      }
    });
    console.log(`✅ [INSERT] Successfully inserted warehouse record: ${createdWh.id}`);

    // Test SELECT
    const fetchedWh = await prisma.warehouse.findUnique({
      where: { id: testWhId }
    });
    console.log(`✅ [SELECT] Successfully fetched warehouse record: ${fetchedWh?.name}`);

    // Test UPDATE
    const updatedWh = await prisma.warehouse.update({
      where: { id: testWhId },
      data: { name: 'Hardening Audit Updated Test Warehouse' }
    });
    console.log(`✅ [UPDATE] Successfully updated warehouse record: ${updatedWh.name}`);

    // Test DELETE
    await prisma.warehouse.delete({
      where: { id: testWhId }
    });
    console.log(`✅ [DELETE] Successfully deleted warehouse record: ${testWhId}`);

    console.log('\n========================================================================');
    console.log('🎉 ALL PRISMA CRUD OPERATIONS PASSED WITH 100% INTEGRITY UNDER RLS!');
    console.log('========================================================================\n');

  } catch (error) {
    console.error('❌ Hardening test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRlsHardening();
