const { PrismaClient } = require('../backend/node_modules/@prisma/client');

async function createEmptyWarehouses() {
  const prisma = new PrismaClient();
  try {
    console.log('========================================================================');
    console.log('🏭 CREATING 3 EMPTY OPERATIONAL WAREHOUSES (SUPABASE POSTGRESQL)');
    console.log('========================================================================\n');

    // Verify existing count
    const existingCount = await prisma.warehouse.count();
    console.log(`Current warehouse count in DB: ${existingCount}`);

    if (existingCount > 0) {
      console.log('Warehouses already exist. Checking records:');
      const existing = await prisma.warehouse.findMany({
        select: { id: true, code: true, name: true, city: true, totalCapacityM3: true }
      });
      console.table(existing);
      return;
    }

    const warehousesToCreate = [
      {
        id: 'wh-jkt-01',
        code: 'WH-JKT-01',
        name: 'Jakarta Central Warehouse',
        address: 'Kawasan Industri Pulo Gadung, Jl. Rawa Gelam No. 5',
        city: 'Jakarta',
        totalCapacityM3: 5000.00,
        usedCapacityM3: 0.00,
        isActive: true,
        managerName: 'Hendra Wijaya',
        contactPhone: '0812-3344-5566',
      },
      {
        id: 'wh-bdg-01',
        code: 'WH-BDG-01',
        name: 'Bandung Distribution Warehouse',
        address: 'Kawasan Terpadu Gedebage, Jl. Soekarno-Hatta No. 78',
        city: 'Bandung',
        totalCapacityM3: 3000.00,
        usedCapacityM3: 0.00,
        isActive: true,
        managerName: 'Asep Sunandar',
        contactPhone: '0813-7788-9900',
      },
      {
        id: 'wh-sby-01',
        code: 'WH-SBY-01',
        name: 'Surabaya Logistics Warehouse',
        address: 'Kawasan Industri SIER, Jl. Rungkut Industri Raya No. 12',
        city: 'Surabaya',
        totalCapacityM3: 4000.00,
        usedCapacityM3: 0.00,
        isActive: true,
        managerName: 'Bambang Prasetyo',
        contactPhone: '0811-2233-4455',
      },
    ];

    for (const wh of warehousesToCreate) {
      const created = await prisma.warehouse.create({
        data: wh,
        select: {
          id: true,
          code: true,
          name: true,
          city: true,
          totalCapacityM3: true,
          usedCapacityM3: true,
          isActive: true,
        },
      });
      console.log(`✅ Created Warehouse: [${created.code}] ${created.name} (${created.city}) - Total Cap: ${created.totalCapacityM3} m³, Used: ${created.usedCapacityM3} m³`);
    }

    console.log('\n========================================================================');
    console.log('🎉 3 EMPTY WAREHOUSES CREATED SUCCESSFULLY!');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('❌ Error creating warehouses:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createEmptyWarehouses();
