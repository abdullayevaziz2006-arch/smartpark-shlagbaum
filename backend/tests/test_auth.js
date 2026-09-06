const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true, parkingLotId: true }
  });
  console.log('=== BARCHA FOYDALANUVCHILAR ===');
  users.forEach(u => {
    console.log(`  ${u.role}: ${u.name} | login: ${u.username} | lotId: ${u.parkingLotId || 'N/A'}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
