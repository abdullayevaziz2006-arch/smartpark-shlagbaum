const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Test ma\'lumotlarini o\'chirish boshlandi...');
  
  // O\'chirish tartibi bog\'liqliklarni hisobga olgan holda
  await prisma.payment.deleteMany({});
  await prisma.parkingSession.deleteMany({});
  await prisma.log.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.tariff.deleteMany({});
  await prisma.car.deleteMany({});
  
  console.log('Barcha test ma\'lumotlari (seanslar, to\'lovlar, loglar, mashinalar, qurilmalar va tariflar) muvaffaqiyatli o\'chirildi!');
  console.log('Siz ro\'yxatdan o\'tgan Tadbirkor (User) va Parkovka (ParkingLot) akkauntlari o\'chirilmasdan saqlab qolindi.');
}

main()
  .catch((e) => {
    console.error('Xatolik yuz berdi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
