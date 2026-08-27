import { describe, expect, test } from "bun:test";

import {
  buildRemuxCommand,
  buildSegmentCommand,
  buildStreamlinkCommand,
  selectQuality,
} from "../src/capture";
import { videoMetadata } from "../src/runner";

describe("capture commands", () => {
  test("chooses the best source capped at 720p", () => {
    expect(selectQuality(["160p", "480p", "720p60", "1080p60"])).toBe("720p60");
    expect(selectQuality(["1080p", "1440p"])).toBe("1080p");
    expect(selectQuality([])).toBe("worst");
  });

  test("segments every six hours without transcoding", () => {
    const command = buildSegmentCommand("/data/part-%03d.ts");
    expect(command).toContain("copy");
    expect(command).toContain("21600");
    expect(command.at(-1)).toBe("/data/part-%03d.ts");
  });

  test("keeps Streamlink and remux commands injection-safe", () => {
    expect(buildStreamlinkCommand("https://www.twitch.tv/test", "720p")).toEqual([
      "streamlink",
      "--stdout",
      "--retry-streams",
      "10",
      "--retry-max",
      "30",
      "https://www.twitch.tv/test",
      "720p",
    ]);
    expect(buildRemuxCommand("part.ts", "part.mp4")).toContain("copy");
  });
});

test("YouTube metadata follows the Recastly naming convention", () => {
  const metadata = videoMetadata(
    {
      recordingId: "recording-1",
      twitchLiveId: "live-1",
      twitchStartedAt: Date.parse("2026-08-27T10:30:00Z"),
      state: "recording",
      streamer: { twitchUserId: "1", login: "alice", displayName: "Alice" },
    },
    2,
    "private",
  );
  expect(metadata.title).toMatch(/^Alice — 2026-08-27 \d{2}:30 — Partie 2$/);
  expect(metadata.description).toContain("https://www.twitch.tv/alice");
  expect(metadata.privacyStatus).toBe("private");
});
