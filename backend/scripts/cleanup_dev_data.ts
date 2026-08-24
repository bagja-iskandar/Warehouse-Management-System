import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDevData() {
  console.log('================================================================');
  console.log('   STARTING SAFE DEVELOPMENT DATA CLEANUP IN POSTGRESQL         ');
  console.log('================================================================\n');

  // 1. Validate Haidar record exists
  const haidar = await prisma.user.findFirst({
    where: {
      email: 'haidar@gmail.com',
      role: UserRole.CUSTOMER,
    },
    include: {
      goodsItems: true,
      customerInvoices: true,
      customerOrders: true,
    },
  });

  if (!haidar) {
    throw new Error('STOP! Haidar customer account (haidar@gmail.com) was NOT found. Aborting cleanup to prevent accidental data loss.');
  }

  console.log(`✅ IDENTIFIED HAIDAR ACCOUNT:`);
  console.log(`   - ID: ${haidar.id}`);
  console.log(`   - Name: ${haidar.name}`);
  console.log(`   - Email: ${haidar.email}`);
  console.log(`   - Goods Count: ${haidar.goodsItems.length}`);
  console.log(`   - Invoices Count: ${haidar.customerInvoices.length}\n`);

  // 2. Count before cleanup
  const totalCustomersBefore = await prisma.user.count({
    where: { role: UserRole.CUSTOMER },
  });
  const totalInvoicesBefore = await prisma.invoice.count();
  const otherCustomers = await prisma.user.findMany({
    where: {
      role: UserRole.CUSTOMER,
      id: { not: haidar.id },
    },
    select: { id: true, name: true, email: true },
  });

  console.log(`📊 BEFORE CLEANUP:`);
  console.log(`   - Total Customers: ${totalCustomersBefore}`);
  console.log(`   - Total Invoices: ${totalInvoicesBefore}`);
  console.log(`   - Non-Haidar Customers to delete: ${otherCustomers.length}\n`);

  const otherCustomerIds = otherCustomers.map((c) => c.id);

  // 3. Execute transactional deletion
  const deletedCounts = await prisma.$transaction(async (tx) => {
    // A. Goods owned by non-Haidar customers
    const nonHaidarGoods = await tx.goodsItem.findMany({
      where: { customerId: { in: otherCustomerIds } },
      select: { id: true },
    });
    const nonHaidarGoodsIds = nonHaidarGoods.map((g) => g.id);

    // B. Delete Goods Mutations
    const deletedMutations = await tx.goodsMutation.deleteMany({
      where: {
        OR: [
          { goodsId: { in: nonHaidarGoodsIds } },
          { actorId: { in: otherCustomerIds } },
        ],
      },
    });

    // C. Delete Order Items
    const deletedOrderItems = await tx.orderItem.deleteMany({
      where: {
        OR: [
          { goodsId: { in: nonHaidarGoodsIds } },
          { order: { customerId: { in: otherCustomerIds } } },
        ],
      },
    });

    // D. Delete Delivery Orders
    const deletedOrders = await tx.deliveryOrder.deleteMany({
      where: { customerId: { in: otherCustomerIds } },
    });

    // E. Delete Payments for non-Haidar invoices
    const deletedPayments = await tx.payment.deleteMany({
      where: {
        OR: [
          { customerId: { in: otherCustomerIds } },
          { invoice: { customerId: { not: haidar.id } } },
        ],
      },
    });

    // F. Delete Invoice Items for non-Haidar invoices
    const deletedInvoiceItems = await tx.invoiceItem.deleteMany({
      where: {
        invoice: { customerId: { not: haidar.id } },
      },
    });

    // G. Delete Invoices (all invoices NOT belonging to Haidar)
    const deletedInvoices = await tx.invoice.deleteMany({
      where: {
        customerId: { not: haidar.id },
      },
    });

    // H. Delete Notifications, Refresh Tokens for non-Haidar customers
    const deletedNotifications = await tx.systemNotification.deleteMany({
      where: { recipientUserId: { in: otherCustomerIds } },
    });

    const deletedTokens = await tx.refreshToken.deleteMany({
      where: { userId: { in: otherCustomerIds } },
    });

    // I. Delete Goods Items for non-Haidar customers
    const deletedGoods = await tx.goodsItem.deleteMany({
      where: { customerId: { in: otherCustomerIds } },
    });

    // J. Delete Non-Haidar Customers
    const deletedUsers = await tx.user.deleteMany({
      where: { id: { in: otherCustomerIds } },
    });

    return {
      deletedUsers: deletedUsers.count,
      deletedInvoices: deletedInvoices.count,
      deletedGoods: deletedGoods.count,
      deletedOrders: deletedOrders.count,
      deletedPayments: deletedPayments.count,
      deletedInvoiceItems: deletedInvoiceItems.count,
      deletedMutations: deletedMutations.count,
      deletedNotifications: deletedNotifications.count,
      deletedTokens: deletedTokens.count,
    };
  });

  console.log(`🧹 DELETION COMPLETED:`);
  console.log(`   - Customers deleted: ${deletedCounts.deletedUsers}`);
  console.log(`   - Invoices deleted: ${deletedCounts.deletedInvoices}`);
  console.log(`   - Goods items deleted: ${deletedCounts.deletedGoods}`);
  console.log(`   - Orders deleted: ${deletedCounts.deletedOrders}`);
  console.log(`   - Payments deleted: ${deletedCounts.deletedPayments}\n`);

  // 4. Reconcile all storage slots and warehouses
  console.log('🔄 Reconciling all storage slots and warehouse capacities in PostgreSQL...');
  const slots = await prisma.storageSlot.findMany({
    include: {
      goodsItems: {
        where: { status: 'STORED' },
        select: { volumeM3: true },
      },
    },
  });

  for (const slot of slots) {
    const calculatedUsedM3 = Number(
      slot.goodsItems.reduce((acc, g) => acc + Number(g.volumeM3), 0).toFixed(2),
    );
    const nextStatus = slot.status === 'MAINTENANCE' ? 'MAINTENANCE' : calculatedUsedM3 === 0 ? 'AVAILABLE' : 'OCCUPIED';
    await prisma.storageSlot.update({
      where: { id: slot.id },
      data: { usedM3: calculatedUsedM3, status: nextStatus },
    });
  }

  const warehouses = await prisma.warehouse.findMany({
    include: {
      goodsItems: {
        where: { status: 'STORED' },
        select: { volumeM3: true },
      },
    },
  });

  for (const wh of warehouses) {
    const calculatedWhUsedM3 = Number(
      wh.goodsItems.reduce((acc, g) => acc + Number(g.volumeM3), 0).toFixed(2),
    );
    await prisma.warehouse.update({
      where: { id: wh.id },
      data: { usedCapacityM3: calculatedWhUsedM3 },
    });
  }

  // 5. Final State Verification
  const remainingCustomers = await prisma.user.findMany({
    where: { role: UserRole.CUSTOMER },
    include: { goodsItems: true, customerInvoices: true },
  });
  const remainingInvoices = await prisma.invoice.findMany({
    include: { customer: true },
  });

  console.log('\n================================================================');
  console.log('   🎉 CLEANUP VERIFICATION SUMMARY                              ');
  console.log('================================================================');
  console.log(`Customers before cleanup : ${totalCustomersBefore}`);
  console.log(`Customers deleted        : ${deletedCounts.deletedUsers}`);
  console.log(`Customers remaining      : ${remainingCustomers.length}`);
  console.log(`Remaining customer       : ${remainingCustomers.map((c) => `${c.name} (${c.email})`).join(', ')}`);
  console.log(`\nInvoices before cleanup  : ${totalInvoicesBefore}`);
  console.log(`Invoices deleted         : ${deletedCounts.deletedInvoices}`);
  console.log(`Invoices remaining       : ${remainingInvoices.length}`);
  console.log(`Remaining invoices       : ${remainingInvoices.map((i) => `#${i.invoiceNumber} (Owner: ${i.customer.name}, Rp${i.totalAmount})`).join(', ')}`);
  console.log('================================================================\n');
}

cleanupDevData()
  .catch((e) => {
    console.error('CLEANUP FAILED:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
