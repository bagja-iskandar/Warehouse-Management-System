const { PrismaClient } = require('../backend/node_modules/@prisma/client');

async function countTables() {
  const prisma = new PrismaClient();
  try {
    console.log('========================================================================');
    console.log('📊 PRODUCTION DATABASE TABLE ROW COUNTS (SUPABASE POSTGRESQL)');
    console.log('========================================================================\n');

    const tableList = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const results = [];
    for (const t of tableList) {
      const tableName = t.table_name;
      const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "public"."${tableName}";`);
      const count = countRes[0].count;
      results.push({
        Table: tableName,
        'Row Count': count,
        Status: count === 0 ? 'EMPTY' : 'HAS DATA',
      });
    }

    console.table(results);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Error counting tables:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

countTables();
