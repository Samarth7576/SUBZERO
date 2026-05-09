"use client";

import { deleteAccountAction } from "../actions/delete-account";

export default function UserMenu({ userName, userInitial }: { userName: string, userInitial: string }) {
  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to completely delete your account and all financial data? This cannot be undone.")) {
      await deleteAccountAction();
    }
  };

  return (
    <div className="relative group">
      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border-2 border-white shadow-sm cursor-pointer hover:bg-indigo-200 transition-colors">
        {userInitial}
      </div>
      
      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
        <div className="p-3 border-b border-slate-50">
          <p className="text-sm font-medium text-slate-800 truncate">{userName}</p>
        </div>
        <div className="p-1 space-y-1">
          <a 
            href="/api/auth/signout"
            className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-medium"
          >
            Sign Out
          </a>
          <a 
            href="/api/user/export"
            className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-medium"
          >
            Export Data (CSV)
          </a>
          <button 
            onClick={handleDeleteAccount}
            className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Delete Account & Data
          </button>
        </div>
      </div>
    </div>
  );
}
