import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import { requireUserId } from "./authHelpers";
import { normalizeTwitchLogin } from "./domain";

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

interface TwitchStream {
  id: string;
  user_id: string;
  title: string;
  started_at: string;
}

class TwitchApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function twitchConfig() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const callbackUrl = process.env.TWITCH_EVENTSUB_CALLBACK_URL;
  const eventSubSecret = process.env.TWITCH_EVENTSUB_SECRET;
  if (!clientId || !clientSecret || !callbackUrl || !eventSubSecret) {
    throw new ConvexError(
      "L’intégration Twitch n’est pas configurée sur le backend.",
    );
  }
  return { clientId, clientSecret, callbackUrl, eventSubSecret };
}

async function getAppToken(clientId: string, clientSecret: string) {
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    { method: "POST" },
  );
  if (!response.ok) throw new Error(`Twitch OAuth: ${response.status}`);
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function helix<T>(
  path: string,
  token: string,
  clientId: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`https://api.twitch.tv/helix${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": clientId,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new TwitchApiError(
      response.status,
      `Twitch Helix ${path}: ${response.status} ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

async function ensureSubscription(
  ctx: ActionCtx,
  streamerId: Id<"streamers">,
  twitchUserId: string,
  type: "stream.online" | "stream.offline",
  token: string,
  config: ReturnType<typeof twitchConfig>,
) {
  const existing = await ctx.runQuery(internal.streamers.getEventSubSubscription, {
    streamerId,
    type,
  });
  if (
    existing &&
    (existing.status === "enabled" ||
      (existing.status === "webhook_callback_verification_pending" &&
        Date.now() - existing.updatedAt < 10 * 60 * 1000))
  ) {
    return;
  }
  type Subscription = {
    id: string;
    status: string;
    type: string;
    condition?: { broadcaster_user_id?: string };
  };
  let subscription: Subscription | undefined;
  try {
    const result = await helix<{ data: Subscription[] }>(
      "/eventsub/subscriptions",
      token,
      config.clientId,
      {
        method: "POST",
        body: JSON.stringify({
          type,
          version: "1",
          condition: { broadcaster_user_id: twitchUserId },
          transport: {
            method: "webhook",
            callback: config.callbackUrl,
            secret: config.eventSubSecret,
          },
        }),
      },
    );
    subscription = result.data[0];
  } catch (error) {
    if (!(error instanceof TwitchApiError) || error.status !== 409) throw error;
    const remote = await helix<{ data: Subscription[] }>(
      `/eventsub/subscriptions?type=${encodeURIComponent(type)}`,
      token,
      config.clientId,
    );
    subscription = remote.data.find(
      (candidate) =>
        candidate.condition?.broadcaster_user_id === twitchUserId &&
        candidate.status === "enabled",
    );
    if (!subscription) throw error;
  }
  if (subscription) {
    await ctx.runMutation(internal.streamers.saveEventSubSubscription, {
      streamerId,
      twitchSubscriptionId: subscription.id,
      type,
      status: subscription.status,
      callbackUrl: config.callbackUrl,
    });
  }
}

export const addStreamer = action({
  args: { input: v.string() },
  handler: async (ctx, { input }): Promise<Id<"streamers">> => {
    const userId = await requireUserId(ctx);
    const login = normalizeTwitchLogin(input);
    const config = twitchConfig();
    const token = await getAppToken(config.clientId, config.clientSecret);
    const users = await helix<{ data: TwitchUser[] }>(
      `/users?login=${encodeURIComponent(login)}`,
      token,
      config.clientId,
    );
    const twitchUser = users.data[0];
    if (!twitchUser) throw new ConvexError("Cette chaîne Twitch est introuvable.");

    const streamerId: Id<"streamers"> = await ctx.runMutation(internal.streamers.upsertAndFollow, {
      userId,
      twitchUserId: twitchUser.id,
      login: twitchUser.login,
      displayName: twitchUser.display_name,
      avatarUrl: twitchUser.profile_image_url || undefined,
    });

    await Promise.all([
      ensureSubscription(
        ctx,
        streamerId,
        twitchUser.id,
        "stream.online",
        token,
        config,
      ),
      ensureSubscription(
        ctx,
        streamerId,
        twitchUser.id,
        "stream.offline",
        token,
        config,
      ),
    ]);

    const streams = await helix<{ data: TwitchStream[] }>(
      `/streams?user_id=${encodeURIComponent(twitchUser.id)}`,
      token,
      config.clientId,
    );
    const stream = streams.data[0];
    if (stream) {
      await ctx.runMutation(internal.recordings.handleStreamOnline, {
        twitchUserId: twitchUser.id,
        twitchLiveId: stream.id,
        title: stream.title,
        startedAt: Date.parse(stream.started_at),
      });
    } else {
      await ctx.runMutation(internal.streamers.markOffline, {
        twitchUserId: twitchUser.id,
        checkedAt: Date.now(),
      });
    }
    return streamerId;
  },
});

export const reconcile = internalAction({
  args: {},
  handler: async (ctx) => {
    if (process.env.CAPTURE_ENABLED === "false") return;
    const config = twitchConfig();
    const token = await getAppToken(config.clientId, config.clientSecret);
    const streamers = await ctx.runQuery(internal.streamers.listForReconciliation, {});

    for (const streamer of streamers) {
      for (const type of ["stream.online", "stream.offline"] as const) {
        if (!streamer.subscriptionTypes.includes(type)) {
          await ensureSubscription(
            ctx,
            streamer._id,
            streamer.twitchUserId,
            type,
            token,
            config,
          );
        }
      }
      const streams = await helix<{ data: TwitchStream[] }>(
        `/streams?user_id=${encodeURIComponent(streamer.twitchUserId)}`,
        token,
        config.clientId,
      );
      const stream = streams.data[0];
      if (stream) {
        await ctx.runMutation(internal.recordings.handleStreamOnline, {
          twitchUserId: streamer.twitchUserId,
          twitchLiveId: stream.id,
          title: stream.title,
          startedAt: Date.parse(stream.started_at),
        });
      } else if (streamer.isLive) {
        await ctx.runMutation(internal.recordings.handleStreamOffline, {
          twitchUserId: streamer.twitchUserId,
          endedAt: Date.now(),
        });
      }
    }
  },
});
