import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { getSessionCounters, getChannelByKind } from "./lib/db";

const CHECK_IN_INTERVAL_MS = 3 * 60 * 1000;

export const runInterviewerCheckIn = internalAction({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.checkIns.applyInterviewerCheckIn, {
      sessionId: args.sessionId,
    });
    return null;
  },
});

export const applyInterviewerCheckIn = internalMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      return null;
    }

    const channel = await getChannelByKind(ctx, args.sessionId, "interviewer");
    if (!channel) {
      return null;
    }

    const runtime = await ctx.db
      .query("agentRuntimeState")
      .withIndex("by_channelId", (q) => q.eq("channelId", channel._id))
      .unique();

    if (runtime?.status === "thinking" || runtime?.status === "streaming") {
      await ctx.scheduler.runAfter(CHECK_IN_INTERVAL_MS, internal.checkIns.runInterviewerCheckIn, {
        sessionId: args.sessionId,
      });
      return null;
    }

    const counters = await getSessionCounters(ctx, args.sessionId);
    if (!counters) {
      return null;
    }

    const sequence = counters.nextSequence + 1;
    const now = Date.now();
    const phase = session.currentPhase;

    const lines = [
      "Quick check-in from the interviewer — still with me?",
      `We're in the ${phase.replace(/_/g, " ")} phase. What's the clearest gap or risk on your mind right now?`,
    ];
    const content = lines.join("\n\n");

    const messageId = await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      channelId: channel._id,
      threadId: channel.threadId,
      sequence,
      speakerType: "interviewer",
      speakerLabel: "Interviewer",
      content,
      phase,
      badgeKind: "brief",
      eventSummary: "Scheduled check-in",
      createdAt: now,
      replyToMessageId: null,
      visibleToCandidate: true,
    });

    await ctx.db.patch(counters._id, {
      nextSequence: sequence,
      interviewerMessageCount: counters.interviewerMessageCount + 1,
    });

    await ctx.db.insert("events", {
      sessionId: args.sessionId,
      channelId: channel._id,
      messageId,
      type: "interviewer_check_in",
      actor: "interviewer",
      target: "candidate",
      metadataJson: JSON.stringify({
        title: "Interviewer check-in",
        detail: "A timed room pulse — respond when you can.",
      }),
      createdAt: now,
    });

    await ctx.scheduler.runAfter(CHECK_IN_INTERVAL_MS, internal.checkIns.runInterviewerCheckIn, {
      sessionId: args.sessionId,
    });

    return null;
  },
});
