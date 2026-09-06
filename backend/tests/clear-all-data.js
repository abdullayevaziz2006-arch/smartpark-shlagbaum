const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Barcha ma\'lumotlarni butunlay o\'chirish boshlandi...');
  
  await prisma.payment.deleteMany({});
  await prisma.parkingSession.deleteMany({});
  await prisma.log.deleteMany({});
  await prisma.device.deleteMany({});
  await prisma.tariff.deleteMany({});
  await prisma.car.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.parkingLot.deleteMany({});
  
  console.log('Barcha ma\'lumotlar (foydalanuvchilar va parkovkalar bilan birga) muvaffaqiyatli o\'chirildi!');
  console.log('Tizim mutlaqo toza holatga keldi. Endi brauzerdan kirib yangitdan ro\'yxatdan o\'tishingiz mumkin.');
}

main()
  .catch((e) => {
    console.error('Xatolik yuz berdi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
