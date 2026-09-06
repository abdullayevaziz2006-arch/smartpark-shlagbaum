const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({
    username: u.username,
    name: u.name,
    role: u.role,
    telegramChatId: u.telegramChatId
  })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
