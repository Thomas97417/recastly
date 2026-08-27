import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import type { WorkerConfig } from "../src/config";
import { YouTubeClient } from "../src/youtube";

const originalFetch = globalThis.fetch;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

function config(): WorkerConfig {
  return {
    convexSiteUrl: "https://example.convex.site",
    workerApiSecret: "secret",
    workerId: "worker-1",
    dataDir: "/data",
    maxConcurrent: 2,
    minFreeBytes: 20 * 1024 ** 3,
    youtubeClientId: "client",
    youtubeClientSecret: "client-secret",
    youtubeRefreshToken: "refresh",
    youtubePrivacy: "private",
  };
}

async function videoFile(size = 9 * 1024 * 1024) {
  const directory = await mkdtemp(join(tmpdir(), "recastly-youtube-test-"));
  temporaryDirectories.push(directory);
  const filePath = join(directory, "part.mp4");
  await Bun.write(filePath, new Uint8Array(size));
  return filePath;
}

describe("YouTube resumable integration", () => {
  test("resumes at the byte acknowledged by a 308 response", async () => {
    const ranges: string[] = [];
    globalThis.fetch = (async (input, init) => {
      const url = String(input);
      if (url.includes("oauth2.googleapis.com")) {
        return Response.json({ access_token: "token", expires_in: 3600 });
      }
      if (url.includes("uploadType=resumable")) {
        return new Response(null, { status: 200, headers: { Location: "https://upload.test/session" } });
      }
      ranges.push(new Headers(init?.headers).get("Content-Range") ?? "");
      if (ranges.length === 1) {
        return new Response(null, { status: 308, headers: { Range: "bytes=0-8388607" } });
      }
      return Response.json({ id: "youtube-video-1" });
    }) as typeof fetch;

    const result = await new YouTubeClient(config()).upload(await videoFile(), {
      title: "Test",
      description: "Description",
      privacyStatus: "private",
    });
    expect(result.id).toBe("youtube-video-1");
    expect(ranges).toEqual([
      "bytes 0-8388607/9437184",
      "bytes 8388608-9437183/9437184",
    ]);
  });

  test("refreshes an expired token before starting the session", async () => {
    let tokens = 0;
    let sessions = 0;
    globalThis.fetch = (async (input) => {
      const url = String(input);
      if (url.includes("oauth2.googleapis.com")) {
        tokens += 1;
        return Response.json({ access_token: `token-${tokens}`, expires_in: 3600 });
      }
      if (url.includes("uploadType=resumable")) {
        sessions += 1;
        return sessions === 1
          ? new Response(null, { status: 401 })
          : new Response(null, { status: 200, headers: { Location: "https://upload.test/session" } });
      }
      return Response.json({ id: "youtube-video-2" });
    }) as typeof fetch;

    const result = await new YouTubeClient(config()).upload(await videoFile(1024), {
      title: "Test",
      description: "Description",
      privacyStatus: "private",
    });
    expect(result.id).toBe("youtube-video-2");
    expect(tokens).toBe(2);
    expect(sessions).toBe(2);
  });
});
