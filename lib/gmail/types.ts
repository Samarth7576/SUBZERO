export interface GmailTokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

export interface GmailProfileResponse {
  emailAddress: string;
  historyId?: string;
}

export interface GmailListResponse {
  messages?: GmailMessageReference[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailHistoryResponse {
  history?: GmailHistoryItem[];
  historyId?: string;
  nextPageToken?: string;
}

export interface GmailHistoryItem {
  messagesAdded?: GmailHistoryMessage[];
}

export interface GmailHistoryMessage {
  message: GmailMessageReference;
}

export interface GmailMessageReference {
  id: string;
  threadId?: string;
}

export interface GmailMessage {
  id: string;
  threadId?: string;
  historyId?: string;
  internalDate?: string;
  payload?: GmailPayload;
  snippet?: string;
  labelIds?: string[];
}

export interface GmailPayload {
  body?: GmailBody;
  headers?: GmailHeader[];
  mimeType?: string;
  parts?: GmailPayload[];
}

export interface GmailBody {
  data?: string;
  size?: number;
}

export interface GmailHeader {
  name: string;
  value: string;
}
