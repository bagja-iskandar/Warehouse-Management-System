import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 1. ALL USERS IN DB ===');
  const users = await prisma.user.findMany({
    include: {
      goodsItems: { select: { id: true, name: true, barcode: true, status: true } },
      customerInvoices: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
      customerOrders: { select: { id: true, orderNumber: true, status: true } },
      refreshTokens: { select: { id: true } },
      customerPayments: { select: { id: true, paymentNumber: true } },
      goodsMutations: { select: { id: true } },
      notifications: { select: { id: true } },
    },
    orderBy: { role: 'asc' },
  });

  console.log(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      companyName: u.companyName,
      phone: u.phone,
      status: u.status,
      goodsCount: u.goodsItems.length,
      invoicesCount: u.customerInvoices.length,
      ordersCount: u.customerOrders.length,
      paymentsCount: u.customerPayments.length,
      goods: u.goodsItems.map((g) => `${g.name} (${g.barcode}) [${g.status}]`),
      invoices: u.customerInvoices.map((i) => `${i.invoiceNumber} [${i.status}] Rp${i.totalAmount}`),
    }))
  );

  console.log('\n=== 2. ALL INVOICES IN DB ===');
  const invoices = await prisma.invoice.findMany({
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: true,
      payments: true,
    },
  });

  console.log(
    invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customer?.name,
      customerEmail: inv.customer?.email,
      totalAmount: Number(inv.totalAmount),
      status: inv.status,
      itemCount: inv.items.length,
      paymentCount: inv.payments.length,
    }))
  );
}

main().finally(() => prisma.$disconnect());
