import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", JSON.stringify(users, null, 2));
  
  const sources = await prisma.sourceAccount.findMany();
  console.log("Sources:", JSON.stringify(sources, null, 2));
  
  const events = await prisma.rawEvent.findMany();
  console.log("Raw Events Count:", events.length);
  if (events.length > 0) {
    console.log("First Event Source ID:", events[0]?.source_id);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
