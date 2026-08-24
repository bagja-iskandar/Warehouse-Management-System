import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    include: {
      goodsItems: true,
      customerInvoices: true,
      customerOrders: true,
    },
  });

  console.log(`Total Customers in DB: ${customers.length}`);
  for (const c of customers) {
    console.log(
      `- ID: ${c.id} | Name: "${c.name}" | Email: "${c.email}" | Company: "${c.companyName}" | Goods: ${c.goodsItems.length} | Invoices: ${c.customerInvoices.length} | Orders: ${c.customerOrders.length}`,
    );
  }

  const invoices = await prisma.invoice.findMany({
    include: { customer: true },
  });
  console.log(`\nTotal Invoices in DB: ${invoices.length}`);
  for (const inv of invoices) {
    console.log(
      `- Inv #${inv.invoiceNumber} | Customer: "${inv.customer?.name}" (${inv.customer?.email}) | Total: Rp${inv.totalAmount} | Status: ${inv.status}`,
    );
  }
}

main().finally(() => prisma.$disconnect());
