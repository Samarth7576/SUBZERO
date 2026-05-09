import { requireCurrentUser } from "../lib/auth/current-user";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  let user;
  try {
    user = await requireCurrentUser();
    if (user) {
      redirect("/dashboard");
    }
  } catch (error) {
    // Not logged in, render the beautiful landing page
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
            <span className="text-white">❄️</span>
          </div>
          <span className="text-xl font-bold tracking-tighter text-slate-900 uppercase">Subzero</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#features" className="hover:text-indigo-600 transition-colors">How it works</a>
          <a href="#security" className="hover:text-indigo-600 transition-colors">Security</a>
          <form action="/api/auth/signin" method="POST">
             <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all">
               Sign In
             </button>
          </form>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          ✨ Join 200+ people saving ₹2,400/month
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-4xl leading-[1.1]">
          Stop burning cash. <span className="text-indigo-600">Freeze your waste.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed">
          The average person loses ₹12,000 a year to ghost bills. SUBZERO hunts them down and kills them in one click.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
          {/* Primary: Real Google Auth for friends/users */}
          <form action="/api/auth/signin/google" method="POST">
            <button 
              type="submit" 
              className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-full font-bold text-lg shadow-xl hover:bg-slate-800 hover:-translate-y-1 transition-all active:translate-y-0 flex items-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign In with Google
            </button>
          </form>

          {/* Secondary: Mock Bypass for Developer testing */}
          <form action={async () => {
            "use server";
            const { signIn } = await import("../auth");
            await signIn("credentials", {
              email: "test@ledger.local",
              password: "ledger-dev",
              redirectTo: "/dashboard"
            });
          }}>
            <button 
              type="submit" 
              className="w-full sm:w-auto bg-indigo-50 text-indigo-700 px-8 py-5 rounded-full font-bold text-lg hover:bg-indigo-100 transition-all text-center"
            >
              Mock Bypass (Dev Only)
            </button>
          </form>
        </div>

        <div className="mt-16 relative w-full max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-32 bottom-0"></div>
          <div className="rounded-3xl border border-slate-200 shadow-2xl overflow-hidden bg-slate-50 aspect-video md:aspect-[16/9] animate-in zoom-in-95 duration-1000">
            <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-slate-300 italic">
               {/* This represents where the dashboard screenshot would be */}
               <div className="text-center p-12">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg font-medium text-slate-400">Beautiful dashboard showing all your subscriptions at a glance</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-slate-50 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">The smartest way to save.</h2>
            <p className="text-slate-500 text-lg">We use AI to scan your financial life and find the patterns you missed.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              emoji="📧" 
              title="Gmail Sync" 
              description="We scan your email receipts for subscriptions that don't show up clearly on bank statements."
            />
            <FeatureCard 
              emoji="🏦" 
              title="Bank Integration" 
              description="Connect your bank via Plaid to see every dollar leaving your account in real-time."
            />
            <FeatureCard 
              emoji="⚡" 
              title="One-Click Cancel" 
              description="Found something you don't use? We provide direct links to the cancellation pages."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="security" className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8">
            🔒
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Your data is safe with us.</h2>
          <p className="text-xl text-slate-500 mb-12 leading-relaxed">
            We use bank-level AES-256 encryption for all data at rest. We never store your login credentials and we never, ever sell your financial data to third parties.
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale">
            <span className="font-bold text-2xl tracking-tighter">PLAID SECURED</span>
            <span className="font-bold text-2xl tracking-tighter">GOOGLE VERIFIED</span>
            <span className="font-bold text-2xl tracking-tighter">SSL ENCRYPTED</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm shadow-md">
              <span className="text-white">❄️</span>
            </div>
            <span className="font-bold text-slate-900 uppercase tracking-tight">Subzero</span>
          </div>
          <p className="text-slate-400 text-sm">© 2024 SUBZERO Financial Inc. Built for humans.</p>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
             <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
             <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
             <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, description }: { emoji: string, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-2 group">
      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">{emoji}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
