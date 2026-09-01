const { PrismaClient } = require('../backend/node_modules/@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  try {
    console.log('Connecting to Supabase PostgreSQL via PrismaClient...');
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version();`;
    console.log('Database connection successful!');
    console.log('Current DB:', result[0].current_database);
    console.log('Current User:', result[0].current_user);

    const userCount = await prisma.user.count();
    const warehouseCount = await prisma.warehouse.count();
    const invoiceCount = await prisma.invoice.count();
    const paymentCount = await prisma.payment.count();

    console.log('Table verification:');
    console.log(`- users table: accessible (rows: ${userCount})`);
    console.log(`- warehouses table: accessible (rows: ${warehouseCount})`);
    console.log(`- invoices table: accessible (rows: ${invoiceCount})`);
    console.log(`- payments table: accessible (rows: ${paymentCount})`);
    console.log('PRISMA_CONNECTION_VERIFIED: YES');
  } catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
