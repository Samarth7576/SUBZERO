"use client";
import PlaidConnectButton from "./plaid-button";

export default function Onboarding({ userName }: { userName: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 text-center relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-50/50 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-50/50 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-sm border border-indigo-100 transform rotate-3">
            ❄️
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Welcome to SUBZERO, {userName.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
            Let's find your hidden subscriptions. Connect a data source to begin your first automated audit.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 transition-all hover:shadow-md hover:-translate-y-1 group">
              <div className="text-4xl mb-5 group-hover:scale-110 transition-transform">🏦</div>
              <h3 className="font-semibold text-slate-900 mb-2 text-lg">Connect Bank</h3>
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">Securely scan your transaction history via Plaid to find hidden "ghost" charges.</p>
              
              <div className="[&>button]:w-full [&>button]:rounded-full [&>button]:shadow-sm [&>button]:!bg-indigo-600 [&>button]:!border-none [&>button]:hover:!bg-indigo-700">
                <PlaidConnectButton />
              </div>
            </div>

            <div className="bg-red-50/50 border border-red-100 rounded-3xl p-8 transition-all hover:shadow-md hover:-translate-y-1 group">
              <div className="text-4xl mb-5 group-hover:scale-110 transition-transform">📧</div>
              <h3 className="font-semibold text-slate-900 mb-2 text-lg">Connect Gmail</h3>
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">Find subscriptions that hide from your bank by analyzing email billing receipts.</p>
              
              <a href="/api/gmail/connect" className="block w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-full font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                Connect Gmail
              </a>
            </div>
          </div>

          <p className="mt-10 text-xs font-medium text-slate-400">
            🔒 Bank-level security. Your data is strictly read-only and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}
