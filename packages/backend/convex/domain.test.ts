import { describe, expect, test } from "bun:test";

import {
  assertTransition,
  canTransition,
  captureSlotAvailable,
  leaseIsAvailable,
  normalizeTwitchLogin,
} from "./domain";

describe("recording state machine", () => {
  test("accepts the normal capture pipeline", () => {
    expect(canTransition("queued", "recording")).toBe(true);
    expect(canTransition("recording", "uploading")).toBe(true);
    expect(canTransition("uploading", "ready")).toBe(true);
  });

  test("rejects terminal state rewinds", () => {
    expect(() => assertTransition("ready", "recording")).toThrow(
      "Invalid recording transition",
    );
  });
});

describe("queue and leases", () => {
  test("reclaims an expired active lease", () => {
    expect(leaseIsAvailable("recording", 999, 1_000)).toBe(true);
    expect(leaseIsAvailable("recording", 1_001, 1_000)).toBe(false);
  });

  test("limits capture concurrency to two", () => {
    expect(captureSlotAvailable(1)).toBe(true);
    expect(captureSlotAvailable(2)).toBe(false);
  });
});

describe("Twitch login normalization", () => {
  test("accepts a URL, @login and plain login", () => {
    expect(normalizeTwitchLogin("https://twitch.tv/Recastly_Test/videos")).toBe(
      "recastly_test",
    );
    expect(normalizeTwitchLogin("@recastly_test")).toBe("recastly_test");
    expect(normalizeTwitchLogin("Recastly_Test")).toBe("recastly_test");
  });

  test("rejects malformed channels", () => {
    expect(() => normalizeTwitchLogin("not a channel")).toThrow();
  });
});
