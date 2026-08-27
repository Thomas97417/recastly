import { ConvexError } from "convex/values";

import { authComponent } from "./auth";

type AuthContext = Parameters<typeof authComponent.safeGetAuthUser>[0];

export async function requireUserId(ctx: AuthContext): Promise<string> {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) throw new ConvexError("Vous devez être connecté.");
  const candidate = user as typeof user & { _id?: string; id?: string };
  const userId = candidate._id ?? candidate.id;
  if (!userId) throw new ConvexError("Identité utilisateur invalide.");
  return String(userId);
}
