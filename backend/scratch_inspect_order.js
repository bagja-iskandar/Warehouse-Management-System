const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.deliveryOrder.findMany({
    include: {
      orderItems: {
        include: {
          goods: true
        }
      },
      customer: true,
      driver: true,
      vehicle: true
    }
  });

  console.log(`Found ${orders.length} delivery orders:`);
  for (const o of orders) {
    console.log(`\n======================================================`);
    console.log(`Order ID: ${o.id}, Order Number: ${o.orderNumber}`);
    console.log(`Type: ${o.type}, Status: ${o.status}`);
    console.log(`Customer: ${o.customer?.name} (${o.customer?.email})`);
    console.log(`Summary: ${o.goodsSummary}, Vol: ${o.totalVolumeM3}, Weight: ${o.totalWeightKg}`);
    console.log(`OrderItems count: ${o.orderItems.length}`);
    for (const item of o.orderItems) {
      console.log(`  - Item ID: ${item.id}, Item Quantity in OrderItem: ${item.quantity}`);
      console.log(`    Goods: ${item.goods?.name}, Goods.quantity in GoodsItem: ${item.goods?.quantity}, Unit: ${item.goods?.unit}, Vol: ${item.goods?.volumeM3}`);
    }
  }

  await prisma.$disconnect();
}

main();
