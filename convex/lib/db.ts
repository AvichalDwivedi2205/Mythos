import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type DbCtx = QueryCtx | MutationCtx;

export async function getSessionByPublicId(ctx: DbCtx, publicId: string) {
  return await ctx.db
    .query("sessions")
    .withIndex("by_publicId", (query) => query.eq("publicId", publicId))
    .unique();
}

export async function getChannelByKind(
  ctx: DbCtx,
  sessionId: Id<"sessions">,
  kind: "interviewer" | "teammate",
) {
  return await ctx.db
    .query("channels")
    .withIndex("by_sessionId_and_kind", (query) =>
      query.eq("sessionId", sessionId).eq("kind", kind),
    )
    .unique();
}

export async function getSessionCounters(ctx: DbCtx, sessionId: Id<"sessions">) {
  return await ctx.db
    .query("sessionCounters")
    .withIndex("by_sessionId", (query) => query.eq("sessionId", sessionId))
    .unique();
}

export async function getSignalState(ctx: DbCtx, sessionId: Id<"sessions">) {
  return await ctx.db
    .query("signalState")
    .withIndex("by_sessionId", (query) => query.eq("sessionId", sessionId))
    .unique();
}

export async function getSessionState(ctx: DbCtx, sessionId: Id<"sessions">) {
  return await ctx.db
    .query("sessionState")
    .withIndex("by_sessionId", (query) => query.eq("sessionId", sessionId))
    .unique();
}

export async function getReportBySessionId(ctx: DbCtx, sessionId: Id<"sessions">) {
  return await ctx.db
    .query("reports")
    .withIndex("by_sessionId", (query) => query.eq("sessionId", sessionId))
    .unique();
}
