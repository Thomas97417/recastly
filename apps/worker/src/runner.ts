import { mkdir, readdir, rm, stat, unlink } from "node:fs/promises";
import { basename, extname, join } from "node:path";

import type { WorkerConfig } from "./config";
import type { StreamCaptureAdapter } from "./capture";
import type { RecordingJob } from "./types";
import { ConvexWorkerClient } from "./convexClient";
import { YouTubeClient } from "./youtube";
import { markFailed } from "./storage";

function dateTime(timestamp: number) {
  const parts = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(timestamp));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export function videoMetadata(
  job: RecordingJob,
  partNumber: number,
  privacyStatus: "private" | "unlisted",
) {
  const started = dateTime(job.twitchStartedAt);
  return {
    title: `${job.streamer.displayName} — ${started} — Partie ${partNumber}`,
    description: [
      `Archive du live de ${job.streamer.displayName}.`,
      `Chaîne Twitch : https://www.twitch.tv/${job.streamer.login}`,
      `Début du live : ${started} (Europe/Paris)`,
      `Partie : ${partNumber}`,
    ].join("\n"),
    privacyStatus,
  };
}

async function mediaFiles(directory: string, extension: ".ts" | ".mp4") {
  return (await readdir(directory))
    .filter((name) => extname(name) === extension)
    .sort()
    .map((name) => join(directory, name));
}

export async function processJob(
  job: RecordingJob,
  config: WorkerConfig,
  client: ConvexWorkerClient,
  capture: StreamCaptureAdapter,
  youtube: YouTubeClient,
): Promise<void> {
  const directory = join(config.dataDir, job.recordingId);
  await mkdir(directory, { recursive: true });
  const heartbeat = setInterval(() => {
    void client.heartbeat(job.recordingId).catch((error) =>
      console.error(`[${job.recordingId}] heartbeat failed`, error),
    );
  }, 30_000);
  let quality = "source ≤ 720p";

  try {
    let segments = await mediaFiles(directory, ".ts");
    if (job.state === "recording" && segments.length === 0) {
      const result = await capture.capture(job.streamer.login, directory);
      quality = result.quality;
      segments = result.segments;
    }
    if (segments.length === 0) {
      const mp4Files = await mediaFiles(directory, ".mp4");
      if (mp4Files.length === 0) throw new Error("No recoverable media file for leased job");
      segments = mp4Files;
    }

    await client.updateJob(job.recordingId, "uploading", { actualQuality: quality });
    for (let index = 0; index < segments.length; index += 1) {
      const partNumber = index + 1;
      const source = segments[index]!;
      const sourceIsMp4 = extname(source) === ".mp4";
      const mp4Path = sourceIsMp4
        ? source
        : join(directory, `part-${String(partNumber).padStart(3, "0")}.mp4`);
      const startedAt = job.twitchStartedAt + index * 6 * 60 * 60 * 1000;
      await client.upsertPart({
        recordingId: job.recordingId,
        partNumber,
        state: "processing",
        startedAt,
        actualQuality: quality,
        localFileName: basename(mp4Path),
      });
      if (!sourceIsMp4) await capture.remux(source, mp4Path);
      const [fileStats, durationSeconds] = await Promise.all([
        stat(mp4Path),
        capture.duration(mp4Path),
      ]);
      await client.upsertPart({
        recordingId: job.recordingId,
        partNumber,
        state: "uploading",
        startedAt,
        endedAt: durationSeconds ? startedAt + durationSeconds * 1000 : undefined,
        durationSeconds,
        sizeBytes: fileStats.size,
        actualQuality: quality,
        localFileName: basename(mp4Path),
      });
      const uploaded = await youtube.upload(
        mp4Path,
        videoMetadata(job, partNumber, config.youtubePrivacy),
      );
      await client.upsertPart({
        recordingId: job.recordingId,
        partNumber,
        state: "ready",
        startedAt,
        endedAt: durationSeconds ? startedAt + durationSeconds * 1000 : undefined,
        durationSeconds,
        sizeBytes: fileStats.size,
        actualQuality: quality,
        youtubeVideoId: uploaded.id,
        youtubeUrl: `https://www.youtube.com/watch?v=${uploaded.id}`,
        youtubePrivacy: config.youtubePrivacy,
      });
      await unlink(mp4Path);
      if (!sourceIsMp4) await unlink(source);
    }
    await client.updateJob(job.recordingId, "ready", { actualQuality: quality });
    await rm(directory, { recursive: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markFailed(directory);
    await client.updateJob(job.recordingId, "failed", { error: message }).catch(() => undefined);
    throw error;
  } finally {
    clearInterval(heartbeat);
  }
}
