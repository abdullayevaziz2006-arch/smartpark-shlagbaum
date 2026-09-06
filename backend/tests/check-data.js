const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE COUNT CHECK ---');
  const userCount = await prisma.user.count();
  const lotCount = await prisma.parkingLot.count();
  const carCount = await prisma.car.count();
  const sessionCount = await prisma.parkingSession.count();
  const paymentCount = await prisma.payment.count();
  const logCount = await prisma.log.count();
  const deviceCount = await prisma.device.count();
  const tariffCount = await prisma.tariff.count();

  console.log('Users:', userCount);
  console.log('ParkingLots:', lotCount);
  console.log('Cars:', carCount);
  console.log('ParkingSessions:', sessionCount);
  console.log('Payments:', paymentCount);
  console.log('Logs:', logCount);
  console.log('Devices:', deviceCount);
  console.log('Tariffs:', tariffCount);

  if (sessionCount > 0) {
    const sessions = await prisma.parkingSession.findMany({ include: { car: true } });
    console.log('Sessions:', JSON.stringify(sessions, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
