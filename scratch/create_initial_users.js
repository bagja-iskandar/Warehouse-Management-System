const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const bcrypt = require('../backend/node_modules/bcryptjs');

async function createInitialUsers() {
  const password = process.env.INITIAL_USER_PASSWORD;
  if (!password) {
    console.error('Error: INITIAL_USER_PASSWORD environment variable is not provided.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    console.log('========================================================================');
    console.log('👤 CREATING INITIAL PRODUCTION USERS (SUPABASE POSTGRESQL)');
    console.log('========================================================================\n');

    // 1. Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, role: true, status: true, createdAt: true },
    });

    if (existingAdmin) {
      console.log('⚠️ An ADMIN user already exists in the database. Aborting to avoid overwriting.');
      console.log('Existing Admin details (non-sensitive):');
      console.table([existingAdmin]);
      return;
    }

    // 2. Hash password with bcrypt cost factor 10 (matching AuthService)
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Define the initial users
    const usersToCreate = [
      {
        id: 'usr-admin-prod-01',
        name: 'Administrator WMS Nusantara',
        email: 'admin@wms.id',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: '081234567890',
        companyName: 'PT WMS Nusantara Logistik',
        address: 'Kawasan Industri Jakarta, Indonesia',
      },
      {
        id: 'usr-driver-prod-01',
        name: 'Driver Utama WMS',
        email: 'driver@wms.id',
        passwordHash,
        role: 'DRIVER',
        status: 'ACTIVE',
        phone: '081234567891',
        driverLicenseNumber: 'SIM-B2-PROD-001',
        driverLicenseExpiry: new Date('2029-12-31'),
      },
      {
        id: 'usr-cust-prod-01',
        name: 'Pelanggan Utama WMS',
        email: 'customer@wms.id',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        phone: '081234567892',
        companyName: 'PT Mitra Logistik Nusantara',
        address: 'Jl. Sudirman Kav. 21, Jakarta Pusat',
      },
    ];

    // 4. Insert each user atomically
    for (const userData of usersToCreate) {
      const created = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
      console.log(`✅ Created User: ${created.email} [${created.role}] (ID: ${created.id})`);
    }

    console.log('\n========================================================================');
    console.log('🎉 INITIAL USERS CREATED SUCCESSFULLY!');
    console.log('========================================================================\n');

  } catch (error) {
    console.error('❌ Failed to create users:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialUsers();
