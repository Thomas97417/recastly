import { afterEach, describe, expect, test } from "bun:test";

import { loadConfig } from "../src/config";

const original = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
});

function configure() {
  Object.assign(process.env, {
    CONVEX_SITE_URL: "https://example.convex.site/",
    WORKER_API_SECRET: "secret",
    YOUTUBE_CLIENT_ID: "client",
    YOUTUBE_CLIENT_SECRET: "client-secret",
    YOUTUBE_REFRESH_TOKEN: "refresh",
  });
}

describe("privacy guard", () => {
  test("defaults to private", () => {
    configure();
    process.env.YOUTUBE_PRIVACY_STATUS = "unlisted";
    process.env.YOUTUBE_UNLISTED_AUDITED = "false";
    expect(loadConfig().youtubePrivacy).toBe("private");
  });

  test("requires an explicit audit flag for unlisted", () => {
    configure();
    process.env.YOUTUBE_PRIVACY_STATUS = "unlisted";
    process.env.YOUTUBE_UNLISTED_AUDITED = "true";
    expect(loadConfig().youtubePrivacy).toBe("unlisted");
  });
});
