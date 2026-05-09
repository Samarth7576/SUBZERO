import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.sourceAccount.updateMany({
    data: { sync_cursor: null },
    where: { identifier: "mock-user@example.com" },
  });
  console.log("Mock account reset successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
