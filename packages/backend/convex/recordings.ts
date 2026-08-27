import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { requireUserId } from "./authHelpers";
import {
  assertTransition,
  captureSlotAvailable,
  leaseIsAvailable,
  type RecordingState,
} from "./domain";

const recordingState = v.union(
  v.literal("queued"),
  v.literal("recording"),
  v.literal("uploading"),
  v.literal("processing"),
  v.literal("ready"),
  v.literal("missed"),
  v.literal("failed"),
);

function captureEnabled() {
  return process.env.CAPTURE_ENABLED !== "false";
}

function youtubePrivacy(): "private" | "unlisted" {
  return process.env.YOUTUBE_PRIVACY_STATUS === "unlisted" &&
    process.env.YOUTUBE_UNLISTED_AUDITED === "true"
    ? "unlisted"
    : "private";
}

async function hasAccess(
  ctx: { db: { query: typeof Object.prototype } } | any,
  recordingId: Id<"recordings">,
  userId: string,
) {
  return await ctx.db
    .query("recordingAccess")
    .withIndex("by_recording_user", (q: any) =>
      q.eq("recordingId", recordingId).eq("userId", userId),
    )
    .unique();
}

export const getRuntimeConfig = query({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return { captureEnabled: captureEnabled(), youtubePrivacy: youtubePrivacy() };
  },
});

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const streamers = (
      await Promise.all(follows.map((follow) => ctx.db.get(follow.streamerId)))
    ).filter((streamer): streamer is NonNullable<typeof streamer> => !!streamer);
    const accesses = await ctx.db
      .query("recordingAccess")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const recordings = (
      await Promise.all(accesses.map((access) => ctx.db.get(access.recordingId)))
    ).filter((recording): recording is NonNullable<typeof recording> => !!recording);
    const hydrate = async (recording: Doc<"recordings">) => ({
      ...recording,
      streamer: await ctx.db.get(recording.streamerId),
    });
    return {
      config: { captureEnabled: captureEnabled(), youtubePrivacy: youtubePrivacy() },
      followedCount: follows.length,
      liveStreamers: streamers.filter((streamer) => streamer.isLive),
      active: await Promise.all(
        recordings
          .filter((recording) => recording.state === "recording")
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map(hydrate),
      ),
      queued: await Promise.all(
        recordings
          .filter((recording) => recording.state === "queued")
          .sort((a, b) => a.queuedAt - b.queuedAt)
          .map(hydrate),
      ),
      processing: await Promise.all(
        recordings
          .filter((recording) =>
            recording.state === "uploading" || recording.state === "processing",
          )
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map(hydrate),
      ),
      failures: await Promise.all(
        recordings
          .filter((recording) => recording.state === "failed")
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 5)
          .map(hydrate),
      ),
    };
  },
});

export const listLibrary = query({
  args: {
    streamerId: v.optional(v.id("streamers")),
    state: v.optional(recordingState),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, filters) => {
    const userId = await requireUserId(ctx);
    const accesses = await ctx.db
      .query("recordingAccess")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const result = [];
    for (const access of accesses) {
      const recording = await ctx.db.get(access.recordingId);
      if (!recording) continue;
      if (filters.streamerId && recording.streamerId !== filters.streamerId) continue;
      if (filters.state && recording.state !== filters.state) continue;
      if (filters.from && recording.twitchStartedAt < filters.from) continue;
      if (filters.to && recording.twitchStartedAt > filters.to) continue;
      const [streamer, parts] = await Promise.all([
        ctx.db.get(recording.streamerId),
        ctx.db
          .query("recordingParts")
          .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
          .collect(),
      ]);
      result.push({ ...recording, streamer, parts });
    }
    return result.sort((a, b) => b.twitchStartedAt - a.twitchStartedAt).slice(0, 100);
  },
});

export const getDetail = query({
  args: { recordingId: v.id("recordings") },
  handler: async (ctx, { recordingId }) => {
    const userId = await requireUserId(ctx);
    if (!(await hasAccess(ctx, recordingId, userId))) {
      throw new ConvexError("Archive introuvable ou accès refusé.");
    }
    const recording = await ctx.db.get(recordingId);
    if (!recording) throw new ConvexError("Archive introuvable.");
    const [streamer, parts] = await Promise.all([
      ctx.db.get(recording.streamerId),
      ctx.db
        .query("recordingParts")
        .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
        .collect(),
    ]);
    return { ...recording, streamer, parts };
  },
});

export const removeMyArchiveAccess = mutation({
  args: { recordingId: v.id("recordings") },
  handler: async (ctx, { recordingId }) => {
    const userId = await requireUserId(ctx);
    const access = await hasAccess(ctx, recordingId, userId);
    if (!access) return;
    await ctx.db.delete(access._id);
    const remaining = await ctx.db
      .query("recordingAccess")
      .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
      .first();
    if (!remaining) {
      const parts = await ctx.db
        .query("recordingParts")
        .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
        .collect();
      const now = Date.now();
      for (const part of parts) {
        if (part.youtubeVideoId) {
          await ctx.db.insert("youtubeDeletionJobs", {
            youtubeVideoId: part.youtubeVideoId,
            state: "queued",
            attempts: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }
  },
});

export const cleanupUserAccess = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const follow of follows) await ctx.db.delete(follow._id);

    const accesses = await ctx.db
      .query("recordingAccess")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const now = Date.now();
    for (const access of accesses) {
      await ctx.db.delete(access._id);
      const remaining = await ctx.db
        .query("recordingAccess")
        .withIndex("by_recording", (q) => q.eq("recordingId", access.recordingId))
        .first();
      if (remaining) continue;
      const parts = await ctx.db
        .query("recordingParts")
        .withIndex("by_recording", (q) => q.eq("recordingId", access.recordingId))
        .collect();
      for (const part of parts) {
        if (part.youtubeVideoId) {
          await ctx.db.insert("youtubeDeletionJobs", {
            youtubeVideoId: part.youtubeVideoId,
            state: "queued",
            attempts: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }
  },
});

export const handleStreamOnline = internalMutation({
  args: {
    twitchUserId: v.string(),
    twitchLiveId: v.string(),
    title: v.optional(v.string()),
    startedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const streamer = await ctx.db
      .query("streamers")
      .withIndex("by_twitch_user_id", (q) => q.eq("twitchUserId", args.twitchUserId))
      .unique();
    if (!streamer) return null;
    await ctx.db.patch(streamer._id, {
      isLive: true,
      currentLiveId: args.twitchLiveId,
      lastCheckedAt: now,
      updatedAt: now,
    });
    const existing = await ctx.db
      .query("recordings")
      .withIndex("by_twitch_live_id", (q) => q.eq("twitchLiveId", args.twitchLiveId))
      .unique();
    if (existing) return existing._id;
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_streamer", (q) => q.eq("streamerId", streamer._id))
      .collect();
    if (follows.length === 0) return null;
    const recordingId = await ctx.db.insert("recordings", {
      streamerId: streamer._id,
      twitchLiveId: args.twitchLiveId,
      state: captureEnabled() ? "queued" : "missed",
      title: args.title,
      twitchStartedAt: args.startedAt,
      queuedAt: now,
      attempts: 0,
      error: captureEnabled() ? undefined : "Capture désactivée par CAPTURE_ENABLED",
      createdAt: now,
      updatedAt: now,
    });
    for (const follow of follows) {
      await ctx.db.insert("recordingAccess", {
        recordingId,
        userId: follow.userId,
        grantedAt: now,
      });
    }
    return recordingId;
  },
});

export const handleStreamOffline = internalMutation({
  args: { twitchUserId: v.string(), endedAt: v.number() },
  handler: async (ctx, args) => {
    const streamer = await ctx.db
      .query("streamers")
      .withIndex("by_twitch_user_id", (q) => q.eq("twitchUserId", args.twitchUserId))
      .unique();
    if (!streamer) return;
    const liveId = streamer.currentLiveId;
    await ctx.db.patch(streamer._id, {
      isLive: false,
      currentLiveId: undefined,
      lastCheckedAt: args.endedAt,
      updatedAt: args.endedAt,
    });
    if (!liveId) return;
    const recording = await ctx.db
      .query("recordings")
      .withIndex("by_twitch_live_id", (q) => q.eq("twitchLiveId", liveId))
      .unique();
    if (!recording) return;
    await ctx.db.patch(recording._id, {
      twitchEndedAt: args.endedAt,
      state: recording.state === "queued" ? "missed" : recording.state,
      error:
        recording.state === "queued"
          ? "Le live s’est terminé avant qu’un créneau soit disponible."
          : recording.error,
      updatedAt: args.endedAt,
    });
  },
});

export const recordWebhookReceipt = internalMutation({
  args: { messageId: v.string(), messageType: v.string(), receivedAt: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhookReceipts")
      .withIndex("by_message_id", (q) => q.eq("messageId", args.messageId))
      .unique();
    if (existing) return false;
    await ctx.db.insert("webhookReceipts", args);
    return true;
  },
});

export const revokeSubscription = internalMutation({
  args: { twitchSubscriptionId: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("eventsubSubscriptions")
      .withIndex("by_twitch_subscription_id", (q) =>
        q.eq("twitchSubscriptionId", args.twitchSubscriptionId),
      )
      .unique();
    if (!subscription) return;
    await ctx.db.patch(subscription._id, { status: args.status, updatedAt: Date.now() });
    await ctx.db.patch(subscription.streamerId, {
      eventSubStatus: "revoked",
      updatedAt: Date.now(),
    });
  },
});

export const claimJob = internalMutation({
  args: { workerId: v.string(), leaseDurationMs: v.number() },
  handler: async (ctx, { workerId, leaseDurationMs }) => {
    if (!captureEnabled()) return null;
    const now = Date.now();
    const all = await ctx.db.query("recordings").collect();
    const activeCount = all.filter(
      (recording) =>
        ["recording", "uploading", "processing"].includes(recording.state) &&
        (recording.leaseExpiresAt ?? 0) > now,
    ).length;
    if (!captureSlotAvailable(activeCount, 2)) return null;
    const candidates = all
      .filter((recording) => leaseIsAvailable(recording.state, recording.leaseExpiresAt, now))
      .sort((a, b) => a.queuedAt - b.queuedAt);
    for (const candidate of candidates) {
      const streamer = await ctx.db.get(candidate.streamerId);
      if (!streamer) continue;
      if (candidate.state === "queued" && !streamer.isLive) {
        await ctx.db.patch(candidate._id, {
          state: "missed",
          error: "Le streamer n’est plus en direct au démarrage du job.",
          updatedAt: now,
        });
        continue;
      }
      const nextState = candidate.state === "queued" ? "recording" : candidate.state;
      await ctx.db.patch(candidate._id, {
        state: nextState,
        workerId,
        leaseExpiresAt: now + leaseDurationMs,
        lastHeartbeatAt: now,
        captureStartedAt: candidate.captureStartedAt ?? now,
        attempts: candidate.attempts + 1,
        updatedAt: now,
      });
      return {
        recordingId: candidate._id,
        twitchLiveId: candidate.twitchLiveId,
        twitchStartedAt: candidate.twitchStartedAt,
        title: candidate.title,
        state: nextState,
        streamer: {
          twitchUserId: streamer.twitchUserId,
          login: streamer.login,
          displayName: streamer.displayName,
        },
      };
    }
    return null;
  },
});

export const heartbeat = internalMutation({
  args: {
    recordingId: v.id("recordings"),
    workerId: v.string(),
    leaseDurationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording || recording.workerId !== args.workerId) return false;
    const now = Date.now();
    await ctx.db.patch(recording._id, {
      leaseExpiresAt: now + args.leaseDurationMs,
      lastHeartbeatAt: now,
      updatedAt: now,
    });
    return true;
  },
});

export const updateJob = internalMutation({
  args: {
    recordingId: v.id("recordings"),
    workerId: v.string(),
    state: recordingState,
    actualQuality: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording || recording.workerId !== args.workerId) return false;
    assertTransition(recording.state as RecordingState, args.state as RecordingState);
    const now = Date.now();
    await ctx.db.patch(recording._id, {
      state: args.state,
      actualQuality: args.actualQuality ?? recording.actualQuality,
      error: args.error,
      uploadStartedAt:
        args.state === "uploading" ? recording.uploadStartedAt ?? now : recording.uploadStartedAt,
      completedAt: args.state === "ready" ? now : recording.completedAt,
      leaseExpiresAt:
        args.state === "ready" || args.state === "failed"
          ? undefined
          : recording.leaseExpiresAt,
      updatedAt: now,
    });
    return true;
  },
});

export const upsertPart = internalMutation({
  args: {
    recordingId: v.id("recordings"),
    workerId: v.string(),
    partNumber: v.number(),
    state: v.union(
      v.literal("recording"),
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    sizeBytes: v.optional(v.number()),
    actualQuality: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    youtubePrivacy: v.optional(v.union(v.literal("private"), v.literal("unlisted"))),
    localFileName: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording || recording.workerId !== args.workerId) return false;
    const current = await ctx.db
      .query("recordingParts")
      .withIndex("by_recording", (q) =>
        q.eq("recordingId", args.recordingId).eq("partNumber", args.partNumber),
      )
      .unique();
    const { workerId: _workerId, ...part } = args;
    const now = Date.now();
    if (current) await ctx.db.patch(current._id, { ...part, updatedAt: now });
    else await ctx.db.insert("recordingParts", { ...part, createdAt: now, updatedAt: now });
    return true;
  },
});

export const claimDeletion = internalMutation({
  args: { leaseDurationMs: v.number() },
  handler: async (ctx, { leaseDurationMs }) => {
    const now = Date.now();
    const jobs = await ctx.db.query("youtubeDeletionJobs").collect();
    const job = jobs
      .filter(
        (candidate) =>
          candidate.state === "queued" ||
          (candidate.state === "processing" && (candidate.leaseExpiresAt ?? 0) <= now),
      )
      .sort((a, b) => a.createdAt - b.createdAt)[0];
    if (!job) return null;
    await ctx.db.patch(job._id, {
      state: "processing",
      attempts: job.attempts + 1,
      leaseExpiresAt: now + leaseDurationMs,
      updatedAt: now,
    });
    return { deletionId: job._id, youtubeVideoId: job.youtubeVideoId };
  },
});

export const completeDeletion = internalMutation({
  args: {
    deletionId: v.id("youtubeDeletionJobs"),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.deletionId);
    if (!job) return;
    await ctx.db.patch(job._id, {
      state: args.success ? "done" : job.attempts >= 5 ? "failed" : "queued",
      error: args.error,
      leaseExpiresAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const purgeOldWebhookReceipts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("webhookReceipts")
      .filter((q) => q.lt(q.field("receivedAt"), cutoff))
      .collect();
    for (const receipt of old) await ctx.db.delete(receipt._id);
  },
});
