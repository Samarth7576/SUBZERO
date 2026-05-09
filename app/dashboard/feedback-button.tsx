"use client";

import { useState } from "react";

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    
    // In a real app, we'd save this to a 'Feedback' table in Prisma.
    // For now, we'll log it clearly and simulate a success state.
    console.log("FEEDBACK RECEIVED:", message);
    
    setTimeout(() => {
      setStatus("sent");
      setMessage("");
      setTimeout(() => {
        setIsOpen(false);
        setStatus("idle");
      }, 2000);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group"
        >
          <span className="text-xl">💬</span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-medium whitespace-nowrap">
            Send Feedback
          </span>
        </button>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 w-80 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-slate-900 text-lg">Help us improve! ✨</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
          </div>
          
          {status === "sent" ? (
            <div className="py-8 text-center animate-in fade-in zoom-in">
              <span className="text-4xl block mb-2">🎉</span>
              <p className="font-semibold text-slate-800">Feedback received!</p>
              <p className="text-xs text-slate-500 mt-1">Thanks for helping us build Ledger.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea 
                autoFocus
                placeholder="What's missing? What's broken? Tell us everything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-32"
                required
              />
              <button 
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {status === "sending" ? "Sending..." : "Send to Founders"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
