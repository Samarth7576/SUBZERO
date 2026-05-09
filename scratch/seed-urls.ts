import { prisma } from "../lib/db";

async function run() {
  console.log("Updating vendor cancellation URLs...");
  await prisma.vendor.updateMany({
    where: { canonical_name: 'Netflix' },
    data: { cancel_url: 'https://www.netflix.com/cancelplan' }
  });
  await prisma.vendor.updateMany({
    where: { canonical_name: 'Spotify' },
    data: { cancel_url: 'https://www.spotify.com/account/cancel/' }
  });
  console.log("Updated URLs successfully!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
