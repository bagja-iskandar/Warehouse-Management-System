const { PrismaClient } = require('../backend/node_modules/@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log('CURRENT USERS COUNT:', users.length);
    if (users.length > 0) {
      console.table(users);
    } else {
      console.log('No users found in database.');
    }
  } catch (error) {
    console.error('Error querying users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
