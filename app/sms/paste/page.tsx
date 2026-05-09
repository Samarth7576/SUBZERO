"use client";

import { useState } from "react";
import { previewSMSAction, ingestSMSAction } from "./actions";
import { useRouter } from "next/navigation";

export default function SMSPastePage() {
  const router = useRouter();
  const [sender, setSender] = useState("");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePreview = async () => {
    if (!text || !sender) return;
    setLoading(true);
    const result = await previewSMSAction(text, sender);
    setPreview(result);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!text || !sender) return;
    setLoading(true);
    await ingestSMSAction(text, sender);
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800 font-sans">
      <div className="mx-auto max-w-2xl space-y-8">
        
        <header className="pt-6 pb-2">
          <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center gap-2 mb-6 transition-colors">
            ← Back to Dashboard
          </button>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
            Manual Ingestion
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Add a Text Message
          </h1>
        </header>

        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <div className="space-y-6">
            <div>
              <label className="block font-medium text-sm text-slate-700 mb-2">Sender / Header</label>
              <input 
                type="text" 
                placeholder="e.g. VM-HDFCBK"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <label className="block font-medium text-sm text-slate-700 mb-2">Message Body</label>
              <textarea 
                placeholder="Dear Customer, an e-NACH mandate for Rs 999.00 towards NETFLIX has been registered..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 resize-none"
              />
            </div>
            
            <button 
              onClick={handlePreview}
              disabled={loading || !text || !sender}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-full font-semibold shadow-sm hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "Analyzing..." : "Analyze SMS"}
            </button>
          </div>
        </section>

        {preview !== undefined && (
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-indigo-100 relative overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Analysis Result</h2>
            
            {preview === null ? (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
                <p className="text-slate-500 font-medium">No subscription pattern detected.</p>
                <p className="text-slate-400 text-sm mt-1">The parser could not find a recurring charge in this message.</p>
              </div>
            ) : (
              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <div className="mb-6">
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Detected Vendor</p>
                  <p className="font-bold text-2xl text-slate-900">{preview.vendorName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8 bg-white/50 p-4 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount</p>
                    <p className="font-semibold text-slate-900 text-lg">{preview.currency} {(preview.amountMinor / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bank / Issuer</p>
                    <p className="font-semibold text-slate-900 text-lg">{preview.senderCanonical}</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleSave}
                  className="w-full bg-white border border-indigo-200 text-indigo-700 py-3 rounded-full font-semibold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  Save to Dashboard
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
