const { PrismaClient } = require('../backend/node_modules/@prisma/client');

async function createVehicles() {
  const prisma = new PrismaClient();
  try {
    console.log('========================================================================');
    console.log('🚛 CREATING 6 STANDBY DEMO VEHICLES (3 REEFER, 3 STANDARD)');
    console.log('========================================================================\n');

    const existingCount = await prisma.vehicle.count();
    console.log(`Current vehicle count in DB: ${existingCount}`);

    if (existingCount > 0) {
      console.log('Vehicles already exist in database. Existing records:');
      const existing = await prisma.vehicle.findMany({
        select: { id: true, plateNumber: true, name: true, type: true, hasRefrigeration: true, status: true }
      });
      console.table(existing);
      return;
    }

    const vehiclesToCreate = [
      // 3 Cold / Refrigerated Vehicles
      {
        id: 'veh-reefer-01',
        plateNumber: 'B 9101 WMS',
        name: 'Isuzu Giga Reefer 01',
        type: 'REEFER_TRUCK',
        maxWeightKg: 8000.00,
        maxVolumeM3: 32.00,
        hasRefrigeration: true,
        minTempCelsius: -22.00,
        status: 'AVAILABLE',
        locationCity: 'Jakarta',
      },
      {
        id: 'veh-reefer-02',
        plateNumber: 'B 9102 WMS',
        name: 'Hino Ranger Cold Chain 02',
        type: 'REEFER_TRUCK',
        maxWeightKg: 6500.00,
        maxVolumeM3: 26.00,
        hasRefrigeration: true,
        minTempCelsius: -20.00,
        status: 'AVAILABLE',
        locationCity: 'Jakarta',
      },
      {
        id: 'veh-reefer-03',
        plateNumber: 'D 9103 WMS',
        name: 'Mitsubishi Fuso Sub-Zero 03',
        type: 'REEFER_TRUCK',
        maxWeightKg: 5000.00,
        maxVolumeM3: 20.00,
        hasRefrigeration: true,
        minTempCelsius: -18.00,
        status: 'AVAILABLE',
        locationCity: 'Bandung',
      },
      // 3 Standard / Non-Cold Vehicles
      {
        id: 'veh-std-01',
        plateNumber: 'B 9201 WMS',
        name: 'Isuzu Elf Box 01',
        type: 'BOX_TRUCK_SMALL',
        maxWeightKg: 3500.00,
        maxVolumeM3: 14.00,
        hasRefrigeration: false,
        minTempCelsius: null,
        status: 'AVAILABLE',
        locationCity: 'Jakarta',
      },
      {
        id: 'veh-std-02',
        plateNumber: 'D 9202 WMS',
        name: 'Hino Dutro Standard 02',
        type: 'BOX_TRUCK_SMALL',
        maxWeightKg: 4000.00,
        maxVolumeM3: 16.00,
        hasRefrigeration: false,
        minTempCelsius: null,
        status: 'AVAILABLE',
        locationCity: 'Bandung',
      },
      {
        id: 'veh-std-03',
        plateNumber: 'L 9203 WMS',
        name: 'Hino Wing Box Heavy 03',
        type: 'WING_BOX_LARGE',
        maxWeightKg: 12000.00,
        maxVolumeM3: 45.00,
        hasRefrigeration: false,
        minTempCelsius: null,
        status: 'AVAILABLE',
        locationCity: 'Surabaya',
      },
    ];

    for (const v of vehiclesToCreate) {
      const created = await prisma.vehicle.create({
        data: v,
        select: {
          id: true,
          plateNumber: true,
          name: true,
          type: true,
          hasRefrigeration: true,
          status: true,
          locationCity: true,
        },
      });
      console.log(`✅ Created Vehicle: [${created.plateNumber}] ${created.name} (${created.type}) - Reefer: ${created.hasRefrigeration} - Status: ${created.status}`);
    }

    console.log('\n========================================================================');
    console.log('🎉 6 DEMO VEHICLES CREATED SUCCESSFULLY (3 REEFER, 3 STANDARD)!');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('❌ Error creating vehicles:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createVehicles();
