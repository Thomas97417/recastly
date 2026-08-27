import type { WorkerConfig } from "./config";

interface UploadMetadata {
  title: string;
  description: string;
  privacyStatus: "private" | "unlisted";
}

interface YouTubeVideoResponse {
  id: string;
}

const CHUNK_SIZE = 8 * 1024 * 1024;

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class YouTubeClient {
  private accessToken?: string;
  private tokenExpiresAt = 0;

  constructor(private readonly config: WorkerConfig) {}

  private async token(force = false): Promise<string> {
    if (!force && this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.youtubeClientId,
        client_secret: this.config.youtubeClientSecret,
        refresh_token: this.config.youtubeRefreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!response.ok) throw new Error(`YouTube OAuth failed: ${response.status}`);
    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return data.access_token;
  }

  private async startSession(
    metadata: UploadMetadata,
    size: number,
    authRetries = 0,
  ): Promise<string> {
    const response = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await this.token()}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(size),
          "X-Upload-Content-Type": "video/mp4",
        },
        body: JSON.stringify({
          snippet: {
            title: metadata.title.slice(0, 100),
            description: metadata.description,
            categoryId: "20",
          },
          status: {
            privacyStatus: metadata.privacyStatus,
            selfDeclaredMadeForKids: false,
          },
        }),
      },
    );
    if (response.status === 401) {
      if (authRetries >= 1) throw new Error("YouTube rejected the refreshed access token");
      await this.token(true);
      return this.startSession(metadata, size, authRetries + 1);
    }
    if (!response.ok) {
      throw new Error(`YouTube resumable session failed: ${response.status} ${await response.text()}`);
    }
    const location = response.headers.get("Location");
    if (!location) throw new Error("YouTube did not return an upload session URL");
    return location;
  }

  async upload(filePath: string, metadata: UploadMetadata): Promise<YouTubeVideoResponse> {
    const file = Bun.file(filePath);
    const total = file.size;
    const sessionUrl = await this.startSession(metadata, total);
    let offset = 0;
    let failures = 0;

    while (offset < total) {
      const endExclusive = Math.min(total, offset + CHUNK_SIZE);
      const response = await fetch(sessionUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${await this.token()}`,
          "Content-Length": String(endExclusive - offset),
          "Content-Range": `bytes ${offset}-${endExclusive - 1}/${total}`,
          "Content-Type": "video/mp4",
        },
        body: file.slice(offset, endExclusive),
      });

      if (response.status === 200 || response.status === 201) {
        return (await response.json()) as YouTubeVideoResponse;
      }
      if (response.status === 308) {
        const range = response.headers.get("Range");
        const uploadedThrough = Number(range?.match(/bytes=0-(\d+)/)?.[1]);
        offset = Number.isFinite(uploadedThrough) ? uploadedThrough + 1 : endExclusive;
        failures = 0;
        continue;
      }
      if (response.status === 401) await this.token(true);
      failures += 1;
      if (failures >= 5) {
        throw new Error(`YouTube upload failed after 5 attempts: ${response.status} ${await response.text()}`);
      }
      await delay(2 ** (failures - 1) * 1000);
    }
    throw new Error("YouTube upload ended without a video response");
  }

  async deleteVideo(videoId: string): Promise<void> {
    let response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${await this.token()}` },
      },
    );
    if (response.status === 401) {
      response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${await this.token(true)}` },
        },
      );
    }
    if (!response.ok && response.status !== 404) {
      throw new Error(`YouTube deletion failed: ${response.status} ${await response.text()}`);
    }
  }
}
