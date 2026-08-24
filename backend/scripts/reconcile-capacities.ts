import { PrismaClient, GoodsStorageStatus, SlotStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- RECONCILING CAPACITIES ACROSS ALL STORAGE SLOTS & WAREHOUSES ---');

  // 1. Storage Slots
  const slots = await prisma.storageSlot.findMany({
    include: {
      goodsItems: {
        where: { status: GoodsStorageStatus.STORED },
        select: { id: true, name: true, barcode: true, volumeM3: true },
      },
    },
  });

  console.log(`Found ${slots.length} storage slots to audit.`);

  for (const slot of slots) {
    const calculatedUsedM3 = Number(
      slot.goodsItems.reduce((acc, g) => acc + Number(g.volumeM3), 0).toFixed(2),
    );
    const capacityM3 = Number(slot.capacityM3);

    let nextStatus = slot.status;
    if (slot.status !== SlotStatus.MAINTENANCE) {
      nextStatus = calculatedUsedM3 === 0 ? SlotStatus.AVAILABLE : SlotStatus.OCCUPIED;
    }

    console.log(
      `Slot [${slot.code}]: DB usedM3=${slot.usedM3}, Calculated=${calculatedUsedM3} m³ (${slot.goodsItems.length} stored goods). Updating...`,
    );

    await prisma.storageSlot.update({
      where: { id: slot.id },
      data: {
        usedM3: calculatedUsedM3,
        status: nextStatus,
      },
    });
  }

  // 2. Warehouses
  const warehouses = await prisma.warehouse.findMany({
    include: {
      goodsItems: {
        where: { status: GoodsStorageStatus.STORED },
        select: { id: true, volumeM3: true },
      },
    },
  });

  console.log(`Found ${warehouses.length} warehouses to audit.`);

  for (const wh of warehouses) {
    const calculatedWhUsedM3 = Number(
      wh.goodsItems.reduce((acc, g) => acc + Number(g.volumeM3), 0).toFixed(2),
    );
    console.log(
      `Warehouse [${wh.code}]: DB usedCapacityM3=${wh.usedCapacityM3}, Calculated=${calculatedWhUsedM3} m³ (${wh.goodsItems.length} stored goods). Updating...`,
    );

    await prisma.warehouse.update({
      where: { id: wh.id },
      data: {
        usedCapacityM3: calculatedWhUsedM3,
      },
    });
  }

  console.log('--- RECONCILIATION COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
