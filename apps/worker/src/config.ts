export interface WorkerConfig {
  convexSiteUrl: string;
  workerApiSecret: string;
  workerId: string;
  dataDir: string;
  maxConcurrent: number;
  minFreeBytes: number;
  youtubeClientId: string;
  youtubeClientSecret: string;
  youtubeRefreshToken: string;
  youtubePrivacy: "private" | "unlisted";
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function loadConfig(): WorkerConfig {
  const requestedPrivacy = process.env.YOUTUBE_PRIVACY_STATUS;
  const youtubePrivacy =
    requestedPrivacy === "unlisted" && process.env.YOUTUBE_UNLISTED_AUDITED === "true"
      ? "unlisted"
      : "private";
  return {
    convexSiteUrl: required("CONVEX_SITE_URL").replace(/\/$/, ""),
    workerApiSecret: required("WORKER_API_SECRET"),
    workerId: process.env.WORKER_ID ?? `worker-${crypto.randomUUID()}`,
    dataDir: process.env.WORKER_DATA_DIR ?? "/data",
    maxConcurrent: Math.min(2, Math.max(1, Number(process.env.WORKER_MAX_CONCURRENT ?? 2))),
    minFreeBytes: Number(process.env.WORKER_MIN_FREE_BYTES ?? 20 * 1024 ** 3),
    youtubeClientId: required("YOUTUBE_CLIENT_ID"),
    youtubeClientSecret: required("YOUTUBE_CLIENT_SECRET"),
    youtubeRefreshToken: required("YOUTUBE_REFRESH_TOKEN"),
    youtubePrivacy,
  };
}
