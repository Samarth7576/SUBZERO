"use client";

import { useCallback, useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";

export default function PlaidConnectButton() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    // Fetch a new link token from our server when the component loads
    const fetchToken = async () => {
      const response = await fetch("/api/plaid/create-link-token", { method: "POST" });
      const data = await response.json();
      setLinkToken(data.link_token);
    };
    fetchToken();
  }, []);

  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    // Send public token to our server to exchange and save
    await fetch("/api/plaid/exchange-public-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        public_token, 
        institution_name: metadata.institution?.name 
      }),
    });
    router.refresh(); // Refresh dashboard to show new bank
  }, [router]);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess,
  });

  const handleOpen = () => {
    // If we are in "Smart Mock Mode" without real API keys, the real Plaid UI will reject our fake token.
    // Instead, we bypass the UI and instantly pretend you logged into a Sandbox bank!
    if (linkToken?.includes("mock")) {
      onSuccess("public-sandbox-mock-token", { institution: { name: "Bank Account" } });
    } else {
      open();
    }
  };

  return (
    <button
      onClick={handleOpen}
      disabled={(!ready && !linkToken?.includes("mock")) || !linkToken}
      className="border-ledger bg-[#1A1714] px-8 py-3 text-center font-bold text-[#F4EFE6] shadow-[3px_3px_0_0_#A23E3E] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50"
    >
      {linkToken ? "Connect Bank" : "Loading..."}
    </button>
  );
}
