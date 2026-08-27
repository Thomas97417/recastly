import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const recordingState = v.union(
  v.literal("queued"),
  v.literal("recording"),
  v.literal("uploading"),
  v.literal("processing"),
  v.literal("ready"),
  v.literal("missed"),
  v.literal("failed"),
);

const partState = v.union(
  v.literal("recording"),
  v.literal("uploading"),
  v.literal("processing"),
  v.literal("ready"),
  v.literal("failed"),
);

export default defineSchema({
  streamers: defineTable({
    twitchUserId: v.string(),
    login: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    isLive: v.boolean(),
    currentLiveId: v.optional(v.string()),
    eventSubStatus: v.union(
      v.literal("pending"),
      v.literal("enabled"),
      v.literal("revoked"),
      v.literal("failed"),
    ),
    lastCheckedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_twitch_user_id", ["twitchUserId"])
    .index("by_login", ["login"])
    .index("by_live", ["isLive"]),

  follows: defineTable({
    userId: v.string(),
    streamerId: v.id("streamers"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_streamer", ["streamerId"])
    .index("by_user_streamer", ["userId", "streamerId"]),

  recordings: defineTable({
    streamerId: v.id("streamers"),
    twitchLiveId: v.string(),
    state: recordingState,
    title: v.optional(v.string()),
    twitchStartedAt: v.number(),
    twitchEndedAt: v.optional(v.number()),
    queuedAt: v.number(),
    captureStartedAt: v.optional(v.number()),
    uploadStartedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    actualQuality: v.optional(v.string()),
    workerId: v.optional(v.string()),
    leaseExpiresAt: v.optional(v.number()),
    lastHeartbeatAt: v.optional(v.number()),
    error: v.optional(v.string()),
    attempts: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_twitch_live_id", ["twitchLiveId"])
    .index("by_state_queued", ["state", "queuedAt"])
    .index("by_streamer_started", ["streamerId", "twitchStartedAt"]),

  recordingParts: defineTable({
    recordingId: v.id("recordings"),
    partNumber: v.number(),
    state: partState,
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    sizeBytes: v.optional(v.number()),
    actualQuality: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    youtubePrivacy: v.optional(
      v.union(v.literal("private"), v.literal("unlisted")),
    ),
    localFileName: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_recording", ["recordingId", "partNumber"])
    .index("by_youtube_video_id", ["youtubeVideoId"]),

  recordingAccess: defineTable({
    recordingId: v.id("recordings"),
    userId: v.string(),
    grantedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_recording", ["recordingId"])
    .index("by_recording_user", ["recordingId", "userId"]),

  eventsubSubscriptions: defineTable({
    twitchSubscriptionId: v.string(),
    streamerId: v.id("streamers"),
    type: v.union(v.literal("stream.online"), v.literal("stream.offline")),
    status: v.string(),
    callbackUrl: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_twitch_subscription_id", ["twitchSubscriptionId"])
    .index("by_streamer_type", ["streamerId", "type"]),

  webhookReceipts: defineTable({
    messageId: v.string(),
    messageType: v.string(),
    receivedAt: v.number(),
  }).index("by_message_id", ["messageId"]),

  youtubeDeletionJobs: defineTable({
    youtubeVideoId: v.string(),
    state: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("done"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    leaseExpiresAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_state", ["state", "createdAt"]),
});
