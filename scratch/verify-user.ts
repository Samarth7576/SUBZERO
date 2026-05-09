import { prisma } from "../lib/db";

async function run() {
  await prisma.user.upsert({
    where: { email: 'test@ledger.local' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Ledger Test User',
      email: 'test@ledger.local',
    }
  });
  console.log('Mock user verified in DB');
}

run().finally(() => prisma.$disconnect());
