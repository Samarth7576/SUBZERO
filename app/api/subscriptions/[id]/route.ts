import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireCurrentUser } from "../../../../lib/auth/current-user";
import { revalidatePath } from "next/cache";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const { amount_minor, cycle } = body;

    const subscription = await prisma.subscription.update({
      where: { 
        id: params.id,
        user_id: user.id // Safety check: ensure it belongs to the user
      },
      data: {
        amount_minor: amount_minor ? BigInt(amount_minor) : undefined,
        cycle: cycle || undefined,
      },
    });

    revalidatePath("/dashboard");
    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Failed to update subscription", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
