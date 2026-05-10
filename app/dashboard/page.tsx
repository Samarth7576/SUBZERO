export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireCurrentUser } from "../../lib/auth/current-user";
import { prisma } from "../../lib/db";
import { syncGmailSource } from "../../lib/gmail/sync";
import { syncPlaidSource } from "../../lib/plaid/sync";
import { getSpendAnalytics } from "../../lib/analytics";
import PlaidConnectButton from "./plaid-button";
import UserMenu from "./user-menu";
import Onboarding from "./onboarding";
import EditSubscription from "./edit-subscription";
import FeedbackButton from "./feedback-button";

interface MonthCount {
  count: number;
  label: string;
}

export default async function DashboardPage() {
  try {
    const user = await requireCurrentUser();
    const analytics = await getSpendAnalytics(user.id);

    const sources = await prisma.sourceAccount.findMany({
      orderBy: { created_at: "desc" },
      where: { user_id: user.id },
    });

    const rawEvents = await prisma.rawEvent.findMany({
      orderBy: { occurred_at: "desc" },
      select: { occurred_at: true },
      where: { source: { user_id: user.id } },
    });

    const subscriptions = await prisma.subscription.findMany({
      where: { user_id: user.id },
      include: { vendor: true },
      orderBy: { display_name: "asc" },
    });

    const findings = await prisma.finding.findMany({
      where: { user_id: user.id, resolved_at: null, dismissed_at: null },
      orderBy: { severity: "desc" },
    });

    const counts = countByMonth(rawEvents.map((event) => event.occurred_at));

    // Calculate time of day for a friendly greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    if (sources.length === 0 && rawEvents.length === 0 && subscriptions.length === 0) {
      return <Onboarding userName={user.name || "User"} />;
    }

    return (
      <main className="min-h-screen bg-slate-50/50 p-4 md:p-8 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <div className="mx-auto max-w-5xl space-y-10">
          
          {/* Friendly Header */}
          <header className="pt-6 pb-4 flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                {greeting}, {user.name?.split(' ')[0] || "there"} 👋
              </h1>
              <p className="mt-2 text-slate-500 text-lg max-w-2xl">
                Here's what's happening with your subscriptions and spending right now.
              </p>
            </div>
            <UserMenu userName={user.name || "User"} userInitial={user.name?.charAt(0).toUpperCase() || "U"} />
          </header>

          {/* Connection Error Banner */}
          {sources.some(s => s.status === 'error') && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-red-800">Connection Interrupted</p>
                  <p className="text-xs text-red-600">One or more of your accounts needs re-authentication to continue syncing data.</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-xs font-bold text-red-700 hover:underline uppercase tracking-wider"
              >
                Try Reconnecting
              </button>
            </div>
          )}

          {/* Quick Stats - Soft Modern Cards */}
          <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <MetricCard label="Connected Sources" value={sources.length} />
            <MetricCard label="Transactions Scanned" value={rawEvents.length} />
            <MetricCard label="Active Subscriptions" value={subscriptions.length} />
            <MetricCard label="Potential Savings" value={`₹${(findings.reduce((sum, f) => sum + Number(f.estimated_save_minor || 0n), 0) / 100).toFixed(0)}`} highlight />
          </section>

          {/* Findings - Actionable & Friendly Alerts */}
          {findings.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <span className="text-2xl">💡</span> Insights & Opportunities
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {findings.map(finding => (
                  <div key={finding.id} className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
                      {finding.kind.replace('_', ' ')}
                    </div>
                    <p className="font-medium text-slate-700 leading-relaxed">{finding.body}</p>
                    {(finding.estimated_save_minor ?? 0n) > 0n && (
                      <p className="mt-3 text-indigo-600 font-medium">
                        You could save {finding.estimated_save_currency} {(Number(finding.estimated_save_minor) / 100).toFixed(2)} / year
                      </p>
                    )}
                    <button className="mt-5 w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white py-2.5 rounded-xl font-medium transition-colors">
                      Review Insight
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
              
              {/* Subscriptions Section */}
              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-800">Your Subscriptions</h2>
                    <p className="text-slate-500 mt-1">Everything you're paying for on a regular basis.</p>
                  </div>
                  <form action="/api/subscriptions/detect" method="POST">
                    <button 
                      type="submit"
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-medium shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                      Refresh Scan
                    </button>
                  </form>
                </div>
                
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="text-4xl mb-3">🔍</div>
                    <h3 className="text-lg font-medium text-slate-700">No subscriptions found yet</h3>
                    <p className="text-slate-500 mt-1 max-w-sm mx-auto">Connect your bank or email below, and we'll automatically find your recurring payments.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="group flex items-center justify-between bg-slate-50 hover:bg-slate-100/50 p-4 rounded-2xl transition-colors border border-transparent hover:border-slate-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl border border-slate-100">
                            {sub.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-lg">{sub.display_name}</p>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{sub.cycle}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-xl font-semibold text-slate-900 tracking-tight">
                            <span className="text-sm font-normal text-slate-400 mr-1">{sub.currency}</span>
                            {(Number(sub.amount_minor) / 100).toFixed(2)}
                          </p>
                          <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {sub.vendor?.cancel_url && (
                              <a 
                                href={sub.vendor.cancel_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                              >
                                Cancel
                              </a>
                            )}
                            <EditSubscription subscription={sub} />
                            <form action={async () => {
                              "use server";
                              await prisma.subscription.deleteMany({ where: { id: sub.id } });
                              const { revalidatePath } = require("next/cache");
                              revalidatePath("/dashboard");
                            }}>
                              <button type="submit" className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors">
                                Ignore
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Data Sources */}
              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-800">Connected Accounts</h2>
                    <p className="text-slate-500 mt-1">Link your accounts to keep your dashboard updated.</p>
                  </div>
                  <div className="flex gap-3">
                    <a
                      className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full font-medium hover:bg-slate-50 transition-colors shadow-sm"
                      href="/api/gmail/connect"
                    >
                      + Add Gmail
                    </a>
                    {/* Wrap the Plaid button in a container to enforce the pill shape if needed, though Plaid Connect Button component has its own styles. We will update PlaidConnectButton separately if needed, but for now we rely on its own design. */}
                    <div className="[&>button]:rounded-full [&>button]:shadow-sm [&>button]:!bg-indigo-600 [&>button]:!border-none [&>button]:hover:!bg-indigo-700 [&>button]:hover:!translate-y-0">
                      <PlaidConnectButton />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {sources.length === 0 ? (
                     <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                     <p className="text-slate-500">No accounts connected yet.</p>
                   </div>
                  ) : (
                    sources.map((source) => (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl" key={source.id}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${source.kind === 'gmail' ? 'bg-red-500' : 'bg-slate-800'}`}>
                            {source.kind === 'gmail' ? 'M' : '🏦'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{source.identifier}</p>
                            <p className="text-xs text-slate-500">
                              {source.kind === 'gmail' ? 'Email Receipt Scanner' : 'Bank Integration'} • Last synced {source.last_synced_at ? source.last_synced_at.toLocaleDateString() : "never"}
                            </p>
                          </div>
                        </div>
                        
                        {(source.kind === "gmail" || source.kind === "plaid") && (
                          <form action={async () => { 
                            "use server"; 
                            if (source.kind === "gmail") await syncGmailSource(source.id); 
                            if (source.kind === "plaid") await syncPlaidSource(source.id);
                            const { revalidatePath } = require("next/cache");
                            revalidatePath("/dashboard");
                          }}>
                            <button className="text-sm bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm" type="submit">
                              Sync Data
                            </button>
                          </form>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {/* Upcoming Payments */}
              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Upcoming Bills</h2>
                <div className="space-y-4">
                  {analytics.upcomingPayments.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500 text-sm">No upcoming bills detected.</p>
                    </div>
                  ) : (
                    analytics.upcomingPayments.map((payment, i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center font-bold text-xs">
                            <span>{payment.dueDate.toLocaleDateString('en-IN', { month: 'short' })}</span>
                            <span className="text-sm">{payment.dueDate.getDate()}</span>
                          </div>
                          <p className="font-medium text-slate-700">{payment.vendorName}</p>
                        </div>
                        <p className="font-semibold text-slate-900">{payment.amount.toFixed(0)}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Category Breakdown */}
              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Spend Categories</h2>
                <div className="space-y-5">
                  {Object.entries(analytics.categoryBreakdown).map(([category, amount]) => (
                    <div key={category}>
                      <div className="flex justify-between text-sm font-medium mb-2 text-slate-600">
                        <span className="capitalize">{category.toLowerCase()}</span>
                        <span>₹{amount.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.max(5, (amount / (analytics.totalMonthlySpend || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {Object.keys(analytics.categoryBreakdown).length === 0 && (
                    <p className="text-slate-500 text-sm text-center italic py-4">Not enough data to show categories.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
        <FeedbackButton />
      </main>
    );
  } catch (error) {
    console.error("Dashboard Error:", error);
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800 font-sans">
        <section className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops, something broke</h1>
          <p className="text-slate-500 text-sm">{error instanceof Error ? error.message : "We couldn't load your dashboard."}</p>
        </section>
      </main>
    );
  }
}

function MetricCard(props: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl p-5 md:p-6 shadow-sm border transition-all hover:-translate-y-1 ${props.highlight ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-200' : 'bg-white border-slate-100'}`}>
      <p className={`text-xs font-semibold tracking-wide uppercase mb-3 ${props.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{props.label}</p>
      <p className={`text-3xl font-bold tracking-tight ${props.highlight ? 'text-white' : 'text-slate-900'}`}>{props.value}</p>
    </div>
  );
}

function countByMonth(dates: Date[]): MonthCount[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const label = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([label, count]) => ({ count, label }));
}
