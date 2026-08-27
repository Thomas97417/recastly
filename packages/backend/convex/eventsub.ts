const encoder = new TextEncoder();

export interface EventSubHeaders {
  messageId: string;
  timestamp: string;
  signature: string;
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export async function createEventSubSignature(
  secret: string,
  messageId: string,
  timestamp: string,
  body: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${messageId}${timestamp}${body}`),
  );
  return `sha256=${toHex(digest)}`;
}

export async function verifyEventSubRequest(
  secret: string,
  headers: EventSubHeaders,
  body: string,
  now = Date.now(),
  maxAgeMs = 10 * 60 * 1000,
): Promise<boolean> {
  const sentAt = Date.parse(headers.timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > maxAgeMs) {
    return false;
  }
  const expected = await createEventSubSignature(
    secret,
    headers.messageId,
    headers.timestamp,
    body,
  );
  return timingSafeEqual(expected, headers.signature);
}
