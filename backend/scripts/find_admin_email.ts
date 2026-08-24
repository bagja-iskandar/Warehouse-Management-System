import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true, name: true, email: true },
  });
  console.log('Admins in DB:', admins);
}

main().finally(() => prisma.$disconnect());
