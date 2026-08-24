const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update invoice status from PENDING_VERIFICATION to PENDING_PAYMENT if needed
  await prisma.$executeRawUnsafe(
    `UPDATE "invoices" SET "status" = 'PENDING_PAYMENT' WHERE "status"::text = 'PENDING_VERIFICATION'`
  );

  // Sync payments for any existing invoice that has paymentMethod or proofUrl but no Payment record
  const invoices = await prisma.invoice.findMany({
    include: { payments: true },
  });

  for (const inv of invoices) {
    if (inv.payments.length === 0 && (inv.status === 'PENDING_PAYMENT' || inv.status === 'PAID')) {
      const paymentNumber = `PAY-202608-${Math.floor(1000 + Math.random() * 9000)}`;
      const status = inv.status === 'PAID' ? 'VERIFIED' : 'UNDER_REVIEW';
      const receiptNumber = inv.status === 'PAID' ? `REC-202608-${Math.floor(1000 + Math.random() * 9000)}` : null;

      await prisma.payment.create({
        data: {
          paymentNumber,
          invoiceId: inv.id,
          customerId: inv.customerId,
          amount: inv.totalAmount,
          paymentMethod: inv.paymentMethod || 'BANK_TRANSFER',
          paymentReference: 'TRX-LEGACY-001',
          proofUrl: inv.paymentProofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
          status,
          receiptNumber,
          submittedAt: inv.updatedAt || new Date(),
          verifiedAt: inv.verifiedAt || (inv.status === 'PAID' ? new Date() : null),
          verifiedByAdminId: inv.verifiedByAdminId || null,
        },
      });
      console.log(`Synced Payment record for invoice ${inv.invoiceNumber}: ${paymentNumber} (${status})`);
    }
  }

  console.log('Database synchronization completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
