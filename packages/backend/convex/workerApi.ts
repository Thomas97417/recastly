import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const LEASE_DURATION_MS = 90_000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function authorized(request: Request) {
  const secret = process.env.WORKER_API_SECRET;
  return !!secret && request.headers.get("Authorization") === `Bearer ${secret}`;
}

async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export const claimJob = httpAction(async (ctx, request) => {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  const body = await parseBody<{ workerId?: string }>(request);
  if (!body?.workerId) return json({ error: "workerId is required" }, 400);
  const job = await ctx.runMutation(internal.recordings.claimJob, {
    workerId: body.workerId,
    leaseDurationMs: LEASE_DURATION_MS,
  });
  return json({ job });
});

export const heartbeat = httpAction(async (ctx, request) => {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  const body = await parseBody<{ recordingId?: string; workerId?: string }>(request);
  if (!body?.recordingId || !body.workerId) return json({ error: "Invalid body" }, 400);
  const ok = await ctx.runMutation(internal.recordings.heartbeat, {
    recordingId: body.recordingId as never,
    workerId: body.workerId,
    leaseDurationMs: LEASE_DURATION_MS,
  });
  return json({ ok });
});

export const updateJob = httpAction(async (ctx, request) => {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  const body = await parseBody<{
    recordingId?: string;
    workerId?: string;
    state?: "queued" | "recording" | "uploading" | "processing" | "ready" | "missed" | "failed";
    actualQuality?: string;
    error?: string;
  }>(request);
  if (!body?.recordingId || !body.workerId || !body.state) {
    return json({ error: "Invalid body" }, 400);
  }
  const ok = await ctx.runMutation(internal.recordings.updateJob, {
    recordingId: body.recordingId as never,
    workerId: body.workerId,
    state: body.state,
    actualQuality: body.actualQuality,
    error: body.error,
  });
  return json({ ok });
});

export const upsertPart = httpAction(async (ctx, request) => {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  const body = await parseBody<{
    recordingId?: string;
    workerId?: string;
    partNumber?: number;
    state?: "recording" | "uploading" | "processing" | "ready" | "failed";
    startedAt?: number;
    endedAt?: number;
    durationSeconds?: number;
    sizeBytes?: number;
    actualQuality?: string;
    youtubeVideoId?: string;
    youtubeUrl?: string;
    youtubePrivacy?: "private" | "unlisted";
    localFileName?: string;
    error?: string;
  }>(request);
  if (
    !body?.recordingId ||
    !body.workerId ||
    body.partNumber === undefined ||
    !body.state ||
    body.startedAt === undefined
  ) {
    return json({ error: "Invalid body" }, 400);
  }
  const ok = await ctx.runMutation(internal.recordings.upsertPart, {
    ...body,
    recordingId: body.recordingId as never,
    workerId: body.workerId,
    partNumber: body.partNumber,
    state: body.state,
    startedAt: body.startedAt,
  });
  return json({ ok });
});

export const claimDeletion = httpAction(async (ctx, request) => {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  const job = await ctx.runMutation(internal.recordings.claimDeletion, {
    leaseDurationMs: LEASE_DURATION_MS,
  });
  return json({ job });
});

export const completeDeletion = httpAction(async (ctx, request) => {
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  const body = await parseBody<{
    deletionId?: string;
    success?: boolean;
    error?: string;
  }>(request);
  if (!body?.deletionId || body.success === undefined) {
    return json({ error: "Invalid body" }, 400);
  }
  await ctx.runMutation(internal.recordings.completeDeletion, {
    deletionId: body.deletionId as never,
    success: body.success,
    error: body.error,
  });
  return json({ ok: true });
});
