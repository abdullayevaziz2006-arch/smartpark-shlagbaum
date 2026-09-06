const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lot = await prisma.parkingLot.create({
    data: { name: 'Asosiy Parkovka', bankName: 'NBU', bankAccount: '2020800000000000001', mfo: '00112' }
  });

  const tariff = await prisma.tariff.create({
    data: { name: 'Standard', pricePerMin: 100, freeMinutes: 10, maxDaily: 50000, lotId: lot.id }
  });

  const car = await prisma.car.create({
    data: { plateNumber: '01A111AA' }
  });

  await prisma.parkingSession.create({
    data: { carId: car.id, lotId: lot.id, entryTime: new Date(Date.now() - 30 * 60000) } // 30 mins ago
  });

  console.log('Seeded data');
}

main().catch(console.error).finally(() => prisma.$disconnect());
