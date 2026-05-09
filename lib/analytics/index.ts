import { prisma } from "../db";

export interface SpendAnalytics {
  totalMonthlySpend: number;
  categoryBreakdown: Record<string, number>;
  upcomingPayments: {
    vendorName: string;
    amount: number;
    currency: string;
    dueDate: Date;
  }[];
}

export async function getSpendAnalytics(userId: string): Promise<SpendAnalytics> {
  const subscriptions = await prisma.subscription.findMany({
    where: { user_id: userId, status: "active" },
    include: { vendor: true },
  });

  const USD_TO_INR = 85;

  const totalMonthlySpend = subscriptions.reduce((sum, sub) => {
    let amount = Number(sub.amount_minor) / 100;
    if (sub.currency === "USD") {
      amount *= USD_TO_INR;
    }
    return sum + amount;
  }, 0);

  const upcomingPayments = subscriptions.map(sub => {
    const lastCharge = sub.last_charge_on || new Date();
    const nextCharge = new Date(lastCharge);
    
    // Simplistic: add 1 month
    nextCharge.setMonth(nextCharge.getMonth() + 1);

    return {
      vendorName: sub.display_name,
      amount: Number(sub.amount_minor) / 100,
      currency: sub.currency,
      dueDate: nextCharge,
    };
  }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Mock category breakdown for now
  const categoryBreakdown: Record<string, number> = {};
  
  for (const sub of subscriptions) {
    const category = ["Netflix", "Spotify"].includes(sub.display_name) ? "Entertainment" : "Software";
    let amount = Number(sub.amount_minor) / 100;
    if (sub.currency === "USD") amount *= USD_TO_INR;
    
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + amount;
  }

  return {
    totalMonthlySpend,
    upcomingPayments,
    categoryBreakdown,
  };
}
