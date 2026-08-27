import { describe, expect, test } from "bun:test";

import { createEventSubSignature, verifyEventSubRequest } from "./eventsub";

describe("Twitch EventSub HMAC", () => {
  test("validates the signed body", async () => {
    const timestamp = "2026-08-27T12:00:00.000Z";
    const body = JSON.stringify({ event: { id: "live-1" } });
    const signature = await createEventSubSignature(
      "secret",
      "message-1",
      timestamp,
      body,
    );
    expect(
      await verifyEventSubRequest(
        "secret",
        { messageId: "message-1", timestamp, signature },
        body,
        Date.parse(timestamp) + 1_000,
      ),
    ).toBe(true);
  });

  test("rejects tampering and stale replay attempts", async () => {
    const timestamp = "2026-08-27T12:00:00.000Z";
    const signature = await createEventSubSignature(
      "secret",
      "message-1",
      timestamp,
      "body",
    );
    const headers = { messageId: "message-1", timestamp, signature };
    expect(await verifyEventSubRequest("secret", headers, "changed", Date.parse(timestamp))).toBe(false);
    expect(
      await verifyEventSubRequest(
        "secret",
        headers,
        "body",
        Date.parse(timestamp) + 11 * 60 * 1_000,
      ),
    ).toBe(false);
  });
});
