import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 1. GOODS IN DB ===');
  const goods = await prisma.goodsItem.findMany({
    include: {
      slot: true,
      warehouse: true,
    },
  });
  console.log(
    goods.map((g) => ({
      id: g.id,
      name: g.name,
      barcode: g.barcode,
      status: g.status,
      slotId: g.slotId,
      slotCode: g.slot?.code,
      volumeM3: Number(g.volumeM3),
      warehouseId: g.warehouseId,
      warehouseName: g.warehouse.name,
    }))
  );

  console.log('\n=== 2. STORAGE SLOTS IN DB ===');
  const slots = await prisma.storageSlot.findMany({
    include: {
      goodsItems: {
        select: {
          id: true,
          name: true,
          status: true,
          volumeM3: true,
        },
      },
    },
    orderBy: { code: 'asc' },
  });
  console.log(
    slots.map((s) => ({
      id: s.id,
      code: s.code,
      zone: s.zone,
      capacityM3: Number(s.capacityM3),
      usedM3_column: Number(s.usedM3),
      status_column: s.status,
      goodsCount: s.goodsItems.length,
      goodsStoredVolume: s.goodsItems
        .filter((g) => g.status === 'STORED')
        .reduce((sum, g) => sum + Number(g.volumeM3), 0),
      goodsStoredNames: s.goodsItems.filter((g) => g.status === 'STORED').map((g) => g.name),
    }))
  );

  console.log('\n=== 3. WAREHOUSES IN DB ===');
  const whs = await prisma.warehouse.findMany({
    include: {
      slots: true,
      goodsItems: true,
    },
  });
  console.log(
    whs.map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      totalCapacityM3: Number(w.totalCapacityM3),
      usedCapacityM3_column: Number(w.usedCapacityM3),
      sumSlotUsedM3_column: w.slots.reduce((sum, s) => sum + Number(s.usedM3), 0),
      sumStoredGoodsVolume: w.goodsItems
        .filter((g) => g.status === 'STORED')
        .reduce((sum, g) => sum + Number(g.volumeM3), 0),
    }))
  );
}

main().finally(() => prisma.$disconnect());
