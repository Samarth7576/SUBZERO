import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  await prisma.rawEvent.deleteMany();
  await prisma.sourceAccount.deleteMany();
  await prisma.user.deleteMany();
  console.log("Database cleared successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
