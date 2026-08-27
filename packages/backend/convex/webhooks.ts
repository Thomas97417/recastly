import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifyEventSubRequest } from "./eventsub";

interface EventSubEnvelope {
  challenge?: string;
  subscription: {
    id: string;
    type: "stream.online" | "stream.offline";
    status: string;
    condition: { broadcaster_user_id: string };
  };
  event?: {
    id?: string;
    broadcaster_user_id: string;
    started_at?: string;
    title?: string;
  };
}

export const twitchEventSub = httpAction(async (ctx, request) => {
  const body = await request.text();
  const headers = {
    messageId: request.headers.get("Twitch-Eventsub-Message-Id") ?? "",
    timestamp: request.headers.get("Twitch-Eventsub-Message-Timestamp") ?? "",
    signature: request.headers.get("Twitch-Eventsub-Message-Signature") ?? "",
  };
  const messageType =
    request.headers.get("Twitch-Eventsub-Message-Type") ?? "notification";
  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  if (!secret || !(await verifyEventSubRequest(secret, headers, body))) {
    return new Response("Invalid EventSub signature", { status: 403 });
  }

  let payload: EventSubEnvelope;
  try {
    payload = JSON.parse(body) as EventSubEnvelope;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (messageType === "webhook_callback_verification") {
    await ctx.runMutation(internal.streamers.confirmEventSubSubscription, {
      twitchSubscriptionId: payload.subscription.id,
    });
    return new Response(payload.challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  const isNew = await ctx.runMutation(internal.recordings.recordWebhookReceipt, {
    messageId: headers.messageId,
    messageType,
    receivedAt: Date.now(),
  });
  if (!isNew) return new Response(null, { status: 204 });
  if (messageType === "revocation") {
    await ctx.runMutation(internal.recordings.revokeSubscription, {
      twitchSubscriptionId: payload.subscription.id,
      status: payload.subscription.status,
    });
    return new Response(null, { status: 204 });
  }
  if (!payload.event) return new Response("Missing event", { status: 400 });

  if (payload.subscription.type === "stream.online" && payload.event.id) {
    await ctx.runMutation(internal.recordings.handleStreamOnline, {
      twitchUserId: payload.event.broadcaster_user_id,
      twitchLiveId: payload.event.id,
      title: payload.event.title,
      startedAt: payload.event.started_at
        ? Date.parse(payload.event.started_at)
        : Date.now(),
    });
  } else if (payload.subscription.type === "stream.offline") {
    await ctx.runMutation(internal.recordings.handleStreamOffline, {
      twitchUserId: payload.event.broadcaster_user_id,
      endedAt: Date.now(),
    });
  }
  return new Response(null, { status: 204 });
});
