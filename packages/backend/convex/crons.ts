import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("reconcile Twitch", { minutes: 15 }, internal.twitch.reconcile, {});
crons.interval(
  "purge EventSub receipts",
  { hours: 6 },
  internal.recordings.purgeOldWebhookReceipts,
  {},
);

export default crons;
