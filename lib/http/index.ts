export interface FetchJsonOptions {
  body?: BodyInit;
  headers?: HeadersInit;
  method?: "GET" | "POST";
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 3;

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        body: options.body,
        headers: options.headers,
        method: options.method ?? "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `External request failed: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as T; // JSON response shape is validated by callers.
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) {
        break;
      }
      await wait(attempt * 400);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("External request failed for an unknown reason.");
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
