import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";
import { twitchEventSub } from "./webhooks";
import {
  claimDeletion,
  claimJob,
  completeDeletion,
  heartbeat,
  updateJob,
  upsertPart,
} from "./workerApi";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({ path: "/twitch/eventsub", method: "POST", handler: twitchEventSub });
http.route({ path: "/worker/jobs/claim", method: "POST", handler: claimJob });
http.route({ path: "/worker/jobs/heartbeat", method: "POST", handler: heartbeat });
http.route({ path: "/worker/jobs/update", method: "POST", handler: updateJob });
http.route({ path: "/worker/parts/upsert", method: "POST", handler: upsertPart });
http.route({ path: "/worker/deletions/claim", method: "POST", handler: claimDeletion });
http.route({
  path: "/worker/deletions/complete",
  method: "POST",
  handler: completeDeletion,
});

export default http;
