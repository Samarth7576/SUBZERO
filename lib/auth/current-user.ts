import { auth } from "../../auth";
import { prisma } from "../db";

export async function requireCurrentUser() {
  const MOCK_USER_ID = "00000000-0000-4000-8000-000000000001";
  
  if (process.env.MOCK_MODE === "true") {
    return {
      id: MOCK_USER_ID,
      email: "mock-user@example.com",
      name: "Mock User",
    } as any;
  }

  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    throw new Error("You must be signed in.");
  }

  return prisma.user.upsert({
    create: {
      email,
      name: session.user?.name,
    },
    update: {
      name: session.user?.name,
    },
    where: {
      email,
    },
  });
}
