import type { Prisma } from "@prisma/client";
import { decryptToken, encryptToken } from "../crypto";
import { prisma } from "../db";
import { hashBody, redactPii } from "../privacy";
import {
  getGmailMessage,
  listBillingMessages,
  listHistoryMessages,
  refreshGmailAccessToken,
} from "./client";
import { extractGmailMessage } from "./message";
import { buildGmailBillingQuery } from "./query";

export interface GmailSyncResult {
  fetched: number;
  inserted: number;
  sourceId: string;
}

export async function syncGmailSource(
  sourceId: string,
): Promise<GmailSyncResult> {
  const source = await prisma.sourceAccount.findUnique({
    where: { id: sourceId },
  });

  if (!source) throw new Error("Source account not found.");

  try {
    let refreshed;
    if (process.env.MOCK_MODE === "true") {
      refreshed = { access_token: "mock_access_token" };
    } else {
      if (source.kind !== "gmail" || !source.oauth_refresh) {
        throw new Error(
          "Active Gmail source account with refresh token not found.",
        );
      }
      const refreshToken = await decryptToken(source.oauth_refresh, source.user_id);
      refreshed = await refreshGmailAccessToken(refreshToken);
    }

    const encryptedAccessToken = await encryptToken(
      refreshed.access_token,
      source.user_id,
    );
    await prisma.sourceAccount.update({
      data: {
        oauth_token: encryptedAccessToken,
        status: "active", // Reset status on success
      },
      where: {
        id: source.id,
      },
    });

    const messageIds = source.sync_cursor
      ? await collectIncrementalMessageIds(
          refreshed.access_token,
          source.sync_cursor,
        )
      : await collectFirstSyncMessageIds(
          refreshed.access_token,
          buildGmailBillingQuery(),
          source,
        );

    let inserted = 0;
    let latestHistoryId = source.sync_cursor;

    for (const messageId of messageIds) {
      const message = await getGmailMessage(refreshed.access_token, messageId);
      latestHistoryId = message.historyId ?? latestHistoryId;
      const extracted = extractGmailMessage(message);
      const redactedBody = redactPii(extracted.body);
      const existing = await prisma.rawEvent.findUnique({
        where: {
          source_id_external_id: {
            external_id: message.id,
            source_id: source.id,
          },
        },
      });

      if (!existing) {
        await prisma.rawEvent.create({
          data: {
            body: redactedBody,
            body_hash: hashBody(redactedBody),
            external_id: message.id,
            occurred_at: extracted.occurredAt,
            raw_json: message as unknown as Prisma.InputJsonValue,
            sender: extracted.sender,
            source_id: source.id,
            subject: extracted.subject,
          },
        });
        inserted += 1;
      }
    }

    await prisma.sourceAccount.update({
      data: {
        last_synced_at: new Date(),
        sync_cursor: latestHistoryId,
      },
      where: {
        id: source.id,
      },
    });

    return {
      fetched: messageIds.length,
      inserted,
      sourceId: source.id,
    };
  } catch (error) {
    console.error("Gmail Sync Error", error);
    await prisma.sourceAccount.update({
      where: { id: source.id },
      data: { status: "error" }
    });
    throw error;
  }
}

export async function syncAllGmailSources(): Promise<GmailSyncResult[]> {
  const sources = await prisma.sourceAccount.findMany({
    where: {
      kind: "gmail",
      status: "active",
    },
  });

  const results: GmailSyncResult[] = [];
  for (const source of sources) {
    results.push(await syncGmailSource(source.id));
  }

  return results;
}

async function collectFirstSyncMessageIds(
  accessToken: string,
  query: string,
  source: any,
): Promise<string[]> {
  if (process.env.MOCK_MODE === "true") {
    return ["mock_msg_1", "mock_msg_2", "mock_msg_3"];
  }

  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const response = await listBillingMessages(accessToken, query, pageToken);
    ids.push(...(response.messages ?? []).map((message) => message.id));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return [...new Set(ids)];
}

async function collectIncrementalMessageIds(
  accessToken: string,
  syncCursor: string,
): Promise<string[]> {
  if (process.env.MOCK_MODE === "true") {
    return []; // No "new" messages for incremental sync in mock mode for now
  }
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const response = await listHistoryMessages(
      accessToken,
      syncCursor,
      pageToken,
    );
    for (const history of response.history ?? []) {
      for (const added of history.messagesAdded ?? []) {
        ids.push(added.message.id);
      }
    }
    pageToken = response.nextPageToken;
  } while (pageToken);

  return [...new Set(ids)];
}
