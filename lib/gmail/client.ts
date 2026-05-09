import { fetchJson } from "../http";
import type {
  GmailHistoryResponse,
  GmailListResponse,
  GmailMessage,
  GmailProfileResponse,
  GmailTokenResponse,
} from "./types";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export function getGmailOAuthConfig() {
  const clientId = process.env.GMAIL_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
  const clientSecret =
    process.env.GMAIL_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3001";

  if (!clientId || !clientSecret) {
    if (process.env.MOCK_MODE === "true") {
      return {
        clientId: "mock_client_id",
        clientSecret: "mock_client_secret",
        redirectUri: `${appUrl}/api/gmail/callback`,
      };
    }
    throw new Error("GMAIL_CLIENT_ID/AUTH_GOOGLE_ID and secret must be set.");
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/gmail/callback`,
  };
}

export function buildGmailAuthUrl(state: string): string {
  const config = getGmailOAuthConfig();
  const params = new URLSearchParams({
    access_type: "offline",
    client_id: config.clientId,
    include_granted_scopes: "true",
    prompt: "consent",
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGmailCode(
  code: string,
): Promise<GmailTokenResponse> {
  const config = getGmailOAuthConfig();

  return fetchJson<GmailTokenResponse>(GOOGLE_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
}

export async function refreshGmailAccessToken(
  refreshToken: string,
): Promise<GmailTokenResponse> {
  const config = getGmailOAuthConfig();

  return fetchJson<GmailTokenResponse>(GOOGLE_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
}

export async function getGmailProfile(
  accessToken: string,
): Promise<GmailProfileResponse> {
  return fetchJson<GmailProfileResponse>(`${GMAIL_API_BASE}/profile`, {
    headers: authHeaders(accessToken),
  });
}

export async function listBillingMessages(
  accessToken: string,
  query: string,
  pageToken?: string,
): Promise<GmailListResponse> {
  const params = new URLSearchParams({
    maxResults: "100",
    q: query,
  });
  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  return fetchJson<GmailListResponse>(
    `${GMAIL_API_BASE}/messages?${params.toString()}`,
    {
      headers: authHeaders(accessToken),
      timeoutMs: 20_000,
    },
  );
}

export async function listHistoryMessages(
  accessToken: string,
  startHistoryId: string,
  pageToken?: string,
): Promise<GmailHistoryResponse> {
  const params = new URLSearchParams({
    historyTypes: "messageAdded",
    startHistoryId,
  });
  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  return fetchJson<GmailHistoryResponse>(
    `${GMAIL_API_BASE}/history?${params.toString()}`,
    {
      headers: authHeaders(accessToken),
      timeoutMs: 20_000,
    },
  );
}

export async function getGmailMessage(
  accessToken: string,
  id: string,
): Promise<GmailMessage> {
  if (process.env.MOCK_MODE === "true" && id.startsWith("mock_")) {
    const mockMessages: Record<string, GmailMessage> = {
      mock_msg_1: {
        id: "mock_msg_1",
        historyId: "12346",
        internalDate: Date.now().toString(),
        payload: {
          headers: [
            { name: "Subject", value: "Your Netflix Receipt" },
            { name: "From", value: "Netflix <info@netflix.com>" },
            { name: "Date", value: new Date().toUTCString() },
          ],
          parts: [{ body: { data: Buffer.from("Your subscription for Premium Ultra HD plan has been renewed for INR 649.").toString("base64") }, mimeType: "text/plain" }],
        },
        snippet: "Your subscription for Premium Ultra HD plan has been renewed for INR 649.",
      },
      mock_msg_2: {
        id: "mock_msg_2",
        historyId: "12347",
        internalDate: (Date.now() - 86400000).toString(),
        payload: {
          headers: [
            { name: "Subject", value: "Spotify Premium Payment Successful" },
            { name: "From", value: "Spotify <no-reply@spotify.com>" },
            { name: "Date", value: new Date(Date.now() - 86400000).toUTCString() },
          ],
          parts: [{ body: { data: Buffer.from("Thanks for your payment of ₹119.00 for Spotify Premium.").toString("base64") }, mimeType: "text/plain" }],
        },
        snippet: "Thanks for your payment of ₹119.00 for Spotify Premium.",
      },
      mock_msg_3: {
        id: "mock_msg_3",
        historyId: "12348",
        internalDate: (Date.now() - 172800000).toString(),
        payload: {
          headers: [
            { name: "Subject", value: "Your Claude Pro subscription" },
            { name: "From", value: "Anthropic <billing@anthropic.com>" },
            { name: "Date", value: new Date(Date.now() - 172800000).toUTCString() },
          ],
          parts: [{ body: { data: Buffer.from("Your subscription for Claude Pro has been renewed for $20.00.").toString("base64") }, mimeType: "text/plain" }],
        },
        snippet: "Your subscription for Claude Pro has been renewed for $20.00.",
      },
    };
    return mockMessages[id] || mockMessages["mock_msg_1"];
  }

  const params = new URLSearchParams({
    format: "full",
  });

  return fetchJson<GmailMessage>(
    `${GMAIL_API_BASE}/messages/${id}?${params.toString()}`,
    {
      headers: authHeaders(accessToken),
      timeoutMs: 20_000,
    },
  );
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
