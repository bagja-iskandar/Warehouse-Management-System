const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  console.log('USERS IN DB:', users);

  const invoices = await prisma.invoice.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      paymentMethod: true,
      paymentProofUrl: true,
      totalAmount: true,
      customer: { select: { id: true, name: true, email: true } },
    },
  });
  console.log('INVOICES IN DB:', invoices);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
