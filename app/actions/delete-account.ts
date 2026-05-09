"use server";

import { prisma } from "../../lib/db";
import { requireCurrentUser } from "../../lib/auth/current-user";
import { redirect } from "next/navigation";

export async function deleteAccountAction() {
  const user = await requireCurrentUser();
  
  // Prisma will automatically delete all related data (subscriptions, events, sources) 
  // because we defined cascade deletes in the schema!
  await prisma.user.delete({
    where: { id: user.id }
  });

  // Redirect to the home page after deletion
  redirect("/");
}
