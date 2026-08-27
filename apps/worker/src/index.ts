import { mkdir } from "node:fs/promises";

import { StreamlinkCaptureAdapter } from "./capture";
import { loadConfig } from "./config";
import { ConvexWorkerClient } from "./convexClient";
import { processJob } from "./runner";
import { cleanupExpiredFailures, hasEnoughFreeSpace } from "./storage";
import { YouTubeClient } from "./youtube";

const POLL_INTERVAL_MS = 5_000;

async function main() {
  const config = loadConfig();
  await mkdir(config.dataDir, { recursive: true });
  const client = new ConvexWorkerClient(
    config.convexSiteUrl,
    config.workerApiSecret,
    config.workerId,
  );
  const capture = new StreamlinkCaptureAdapter();
  const youtube = new YouTubeClient(config);
  const active = new Map<string, Promise<void>>();

  console.info(
    `Recastly worker ${config.workerId} started (${config.maxConcurrent} slots, YouTube ${config.youtubePrivacy})`,
  );

  while (true) {
    try {
      await cleanupExpiredFailures(config.dataDir);
      const deletion = await client.claimDeletion();
      if (deletion) {
        try {
          await youtube.deleteVideo(deletion.youtubeVideoId);
          await client.completeDeletion(deletion.deletionId, true);
        } catch (error) {
          await client.completeDeletion(
            deletion.deletionId,
            false,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      if (
        active.size < config.maxConcurrent &&
        (await hasEnoughFreeSpace(config.dataDir, config.minFreeBytes))
      ) {
        const job = await client.claim();
        if (job && !active.has(job.recordingId)) {
          const task = processJob(job, config, client, capture, youtube)
            .catch((error) => console.error(`[${job.recordingId}] failed`, error))
            .finally(() => active.delete(job.recordingId));
          active.set(job.recordingId, task);
        }
      }
    } catch (error) {
      console.error("Worker loop failed", error);
    }
    await Bun.sleep(POLL_INTERVAL_MS);
  }
}

if (import.meta.main) await main();
