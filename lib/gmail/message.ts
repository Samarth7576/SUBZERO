import type { GmailHeader, GmailMessage, GmailPayload } from "./types";

export interface ExtractedGmailMessage {
  body: string;
  occurredAt: Date;
  sender: string | null;
  subject: string | null;
}

export function extractGmailMessage(
  message: GmailMessage,
): ExtractedGmailMessage {
  const headers = message.payload?.headers ?? [];
  const sender = getHeader(headers, "from");
  const subject = getHeader(headers, "subject");
  const dateHeader = getHeader(headers, "date");
  const occurredAt = parseOccurredAt(message.internalDate, dateHeader);
  const body = extractBody(message.payload) || message.snippet || "";

  return {
    body,
    occurredAt,
    sender,
    subject,
  };
}

function getHeader(headers: GmailHeader[], name: string): string | null {
  const header = headers.find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );

  return header?.value ?? null;
}

function parseOccurredAt(
  internalDate?: string,
  dateHeader?: string | null,
): Date {
  if (internalDate && /^\d+$/.test(internalDate)) {
    return new Date(Number(internalDate));
  }

  if (dateHeader) {
    const parsed = new Date(dateHeader);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function extractBody(payload?: GmailPayload): string {
  if (!payload) {
    return "";
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  const parts = payload.parts ?? [];
  const plainText = parts.find((part) => part.mimeType === "text/plain");
  if (plainText?.body?.data) {
    return decodeBase64Url(plainText.body.data);
  }

  const html = parts.find((part) => part.mimeType === "text/html");
  if (html?.body?.data) {
    return htmlToText(decodeBase64Url(html.body.data));
  }

  return parts.map(extractBody).filter(Boolean).join("\n");
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");

  return Buffer.from(normalized, "base64").toString("utf8");
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
