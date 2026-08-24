const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectAndCleanup() {
  console.log('--- Inspecting goods in database ---');
  const allGoods = await prisma.goodsItem.findMany({
    include: {
      customer: true,
      warehouse: true,
      slot: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${allGoods.length} total goods items.`);
  for (const g of allGoods) {
    console.log(`- [${g.id}] SKU: ${g.barcode} | Name: "${g.name}" | Status: ${g.status} | Customer: ${g.customer?.email} | Slot: ${g.slot?.code || 'None'} | CreatedAt: ${g.createdAt}`);
  }

  console.log('\n--- Inspecting test users ---');
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { startsWith: 'tenant.test' } },
        { email: { startsWith: 'haidar.test' } },
      ],
    },
  });
  console.log(`Found ${testUsers.length} test users:`, testUsers.map((u) => u.email));
}

inspectAndCleanup().finally(() => prisma.$disconnect());
