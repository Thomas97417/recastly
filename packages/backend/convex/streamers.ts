import { ConvexError, v } from "convex/values";

import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireUserId } from "./authHelpers";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return Promise.all(
      follows.map(async (follow) => ({
        followId: follow._id,
        followedAt: follow.createdAt,
        streamer: await ctx.db.get(follow.streamerId),
      })),
    );
  },
});

export const removeFollow = mutation({
  args: { streamerId: v.id("streamers") },
  handler: async (ctx, { streamerId }) => {
    const userId = await requireUserId(ctx);
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_user_streamer", (q) =>
        q.eq("userId", userId).eq("streamerId", streamerId),
      )
      .unique();
    if (follow) await ctx.db.delete(follow._id);
  },
});

export const upsertAndFollow = internalMutation({
  args: {
    userId: v.string(),
    twitchUserId: v.string(),
    login: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let streamer = await ctx.db
      .query("streamers")
      .withIndex("by_twitch_user_id", (q) => q.eq("twitchUserId", args.twitchUserId))
      .unique();
    let streamerId = streamer?._id;
    if (streamer) {
      await ctx.db.patch(streamer._id, {
        login: args.login,
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
    } else {
      streamerId = await ctx.db.insert("streamers", {
        twitchUserId: args.twitchUserId,
        login: args.login,
        displayName: args.displayName,
        avatarUrl: args.avatarUrl,
        isLive: false,
        eventSubStatus: "pending",
        lastCheckedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
    if (!streamerId) throw new Error("Streamer creation failed");
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_user_streamer", (q) =>
        q.eq("userId", args.userId).eq("streamerId", streamerId!),
      )
      .unique();
    if (existing) return streamerId;
    const count = (
      await ctx.db
        .query("follows")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect()
    ).length;
    if (count >= 10) throw new ConvexError("Vous pouvez suivre au maximum 10 streamers.");
    await ctx.db.insert("follows", {
      userId: args.userId,
      streamerId,
      createdAt: now,
    });
    return streamerId;
  },
});

export const saveEventSubSubscription = internalMutation({
  args: {
    streamerId: v.id("streamers"),
    twitchSubscriptionId: v.string(),
    type: v.union(v.literal("stream.online"), v.literal("stream.offline")),
    status: v.string(),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const current = await ctx.db
      .query("eventsubSubscriptions")
      .withIndex("by_streamer_type", (q) =>
        q.eq("streamerId", args.streamerId).eq("type", args.type),
      )
      .unique();
    const fields = {
      twitchSubscriptionId: args.twitchSubscriptionId,
      streamerId: args.streamerId,
      type: args.type,
      status: args.status,
      callbackUrl: args.callbackUrl,
      updatedAt: now,
    };
    if (current) await ctx.db.patch(current._id, fields);
    else await ctx.db.insert("eventsubSubscriptions", { ...fields, createdAt: now });
    await ctx.db.patch(args.streamerId, {
      eventSubStatus: args.status === "enabled" ? "enabled" : "pending",
      updatedAt: now,
    });
  },
});

export const getEventSubSubscription = internalQuery({
  args: {
    streamerId: v.id("streamers"),
    type: v.union(v.literal("stream.online"), v.literal("stream.offline")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventsubSubscriptions")
      .withIndex("by_streamer_type", (q) =>
        q.eq("streamerId", args.streamerId).eq("type", args.type),
      )
      .unique();
  },
});

export const confirmEventSubSubscription = internalMutation({
  args: { twitchSubscriptionId: v.string() },
  handler: async (ctx, { twitchSubscriptionId }) => {
    const subscription = await ctx.db
      .query("eventsubSubscriptions")
      .withIndex("by_twitch_subscription_id", (q) =>
        q.eq("twitchSubscriptionId", twitchSubscriptionId),
      )
      .unique();
    if (!subscription) return;
    const now = Date.now();
    await ctx.db.patch(subscription._id, { status: "enabled", updatedAt: now });
    await ctx.db.patch(subscription.streamerId, {
      eventSubStatus: "enabled",
      updatedAt: now,
    });
  },
});

export const markOffline = internalMutation({
  args: { twitchUserId: v.string(), checkedAt: v.number() },
  handler: async (ctx, args) => {
    const streamer = await ctx.db
      .query("streamers")
      .withIndex("by_twitch_user_id", (q) => q.eq("twitchUserId", args.twitchUserId))
      .unique();
    if (streamer) {
      await ctx.db.patch(streamer._id, {
        isLive: false,
        currentLiveId: undefined,
        lastCheckedAt: args.checkedAt,
        updatedAt: args.checkedAt,
      });
    }
  },
});

export const listForReconciliation = internalQuery({
  args: {},
  handler: async (ctx) => {
    const streamers = await ctx.db.query("streamers").collect();
    return Promise.all(
      streamers.map(async (streamer) => {
        const subscriptions = await ctx.db
          .query("eventsubSubscriptions")
          .withIndex("by_streamer_type", (q) => q.eq("streamerId", streamer._id))
          .collect();
        return {
          ...streamer,
          subscriptionTypes: subscriptions
            .filter((subscription) => subscription.status === "enabled")
            .map((subscription) => subscription.type),
        };
      }),
    );
  },
});
