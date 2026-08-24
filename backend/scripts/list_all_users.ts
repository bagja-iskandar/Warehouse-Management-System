import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyName: true,
      phone: true,
      status: true,
    },
    orderBy: { role: 'asc' },
  });

  console.log('Total Users:', allUsers.length);
  console.log(JSON.stringify(allUsers, null, 2));
}

main().finally(() => prisma.$disconnect());
