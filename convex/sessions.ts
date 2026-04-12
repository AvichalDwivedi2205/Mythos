import { createThread } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import {
  internalMutation,
  type MutationCtx,
  query,
  mutation,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getReportBySessionId, getSessionByPublicId, getSessionCounters, getSignalState } from "./lib/db";
import {
  modeValidator,
  roomValidator,
  sessionStatusValidator,
} from "./lib/validators";
import { createPublicId } from "../lib/utils";
import { buildInterviewBlueprint, serializeClarifications } from "../lib/interview-blueprint";

export const createSession = mutation({
  args: {
    candidateName: v.string(),
    mode: modeValidator,
    jobDescription: v.string(),
    resumeText: v.string(),
    resumeSummary: v.string(),
    resumeFileName: v.optional(v.string()),
    teammateSpecialization: v.optional(
      v.union(v.literal("sre_infra"), v.literal("backend"), v.literal("data")),
    ),
  },
  returns: v.object({ sessionPublicId: v.string() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const publicId = createPublicId("session");
    const candidateName = args.candidateName.trim() || "Candidate";
    const blueprint = buildInterviewBlueprint({
      candidateName,
      jobDescription: args.jobDescription,
      resumeSummary: args.resumeSummary,
      resumeText: args.resumeText,
      teammateSpecializationOverride: args.teammateSpecialization ?? null,
    });

    const sessionId = await ctx.db.insert("sessions", {
      publicId,
      candidateName,
      mode: args.mode,
      status: "active",
      scenarioId: blueprint.scenarioId,
      scenarioVersion: new Date(now).toISOString().slice(0, 10),
      rubricVersion: "v3.0",
      title: blueprint.title,
      subtitle: blueprint.subtitle,
      currentPhase: "problem_framing",
      timeBudgetMs: 60 * 60 * 1000,
      startedAt: now,
      endedAt: null,
      interviewerChannelId: null,
      teammateChannelId: null,
      reportId: null,
      teammateSpecialization: blueprint.teammateSpecialization,
      teammateName: blueprint.teammateName,
      jobDescription: args.jobDescription.trim(),
      resumeText: args.resumeText.trim(),
      resumeSummary: args.resumeSummary.trim(),
      problemStatement: blueprint.problemStatement,
      approvedClarificationsJson: serializeClarifications(blueprint.approvedClarifications),
      solutionTemplate: blueprint.solutionTemplate,
      sharedContextSeed: blueprint.sharedContextSeed,
      ...(args.resumeFileName?.trim()
        ? { resumeFileName: args.resumeFileName.trim() }
        : {}),
    });

    const interviewerThreadId = await createThread(ctx, components.agent as never, {
      title: `${publicId}-interviewer`,
      userId: publicId,
      summary: "Interviewer channel thread",
    });
    const teammateThreadId = await createThread(ctx, components.agent as never, {
      title: `${publicId}-teammate`,
      userId: publicId,
      summary: "Teammate channel thread",
    });

    const interviewerChannelId = await ctx.db.insert("channels", {
      sessionId,
      kind: "interviewer",
      title: "Interviewer",
      agentRole: "Interviewer",
      specialization: null,
      threadId: interviewerThreadId,
      sortOrder: 0,
    });

    const teammateChannelId = await ctx.db.insert("channels", {
      sessionId,
      kind: "teammate",
      title: `${blueprint.teammateName} · ${blueprint.teammateLabel}`,
      agentRole: blueprint.teammateName,
      specialization: blueprint.teammateLabel,
      threadId: teammateThreadId,
      sortOrder: 1,
    });

    await ctx.db.patch(sessionId, {
      interviewerChannelId,
      teammateChannelId,
    });

    await ctx.db.insert("sessionState", {
      sessionId,
      currentArchitectureSummary: "",
      currentRequirementSummary: blueprint.initialRequirementSummary,
      latestRiskSummary: blueprint.initialRiskSummary,
      latestInterviewerChallenge: "",
      latestTeammateConcern: "",
      latestCrossChannelDigest: blueprint.sharedContextSeed,
      updatedAt: now,
    });

    await ctx.db.insert("signalState", {
      sessionId,
      requirementsScore: 24,
      architectureScore: 12,
      tradeoffScore: 8,
      collaborationScore: 18,
      nudgesGiven: 0,
      updatedAt: now,
    });

    await ctx.db.insert("sessionCounters", {
      sessionId,
      nextSequence: 0,
      candidateMessageCount: 0,
      interviewerMessageCount: 0,
      teammateMessageCount: 0,
      nudgeCount: 0,
      stressCount: 0,
      clarificationCount: 0,
      teammateConcernCount: 0,
      revisionCount: 0,
      hintFishingCount: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    });

    const interviewerRuntimeId = await ctx.db.insert("agentRuntimeState", {
      sessionId,
      channelId: interviewerChannelId,
      agentRole: "Interviewer",
      status: "idle",
      mode: "probe",
      phase: "problem_framing",
      lastHeartbeatAt: now,
      lastVisibleMessageId: null,
    });

    const teammateRuntimeId = await ctx.db.insert("agentRuntimeState", {
      sessionId,
      channelId: teammateChannelId,
      agentRole: blueprint.teammateName,
      status: "idle",
      mode: "collaborate",
      phase: "problem_framing",
      lastHeartbeatAt: now,
      lastVisibleMessageId: null,
    });

    await ctx.db.insert("phaseSummaries", {
      sessionId,
      phase: "problem_framing",
      summary: "Interview initialized.",
      startedAt: now,
      endedAt: null,
    });

    await ctx.db.insert("solutionWorkspaces", {
      sessionId,
      template: blueprint.solutionTemplate,
      draftContent: blueprint.solutionTemplate,
      finalContent: null,
      finalSubmittedAt: null,
      updatedAt: now,
    });

    for (const note of blueprint.defaultNotes) {
      await ctx.db.insert("scratchNotes", {
        sessionId,
        label: note.label,
        color: note.color,
        content: note.content,
        sortOrder: note.sortOrder,
        archived: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    const interviewerMessageId = await insertMessage(ctx, {
      sessionId,
      channelId: interviewerChannelId,
      threadId: interviewerThreadId,
      speakerType: "interviewer",
      speakerLabel: "Interviewer",
      content: blueprint.initialInterviewerBrief,
      phase: "problem_framing",
      badgeKind: "brief",
      eventSummary: "Brief",
    });

    const teammateMessageId = await insertMessage(ctx, {
      sessionId,
      channelId: teammateChannelId,
      threadId: teammateThreadId,
      speakerType: "teammate",
      speakerLabel: blueprint.teammateName,
      content: blueprint.initialTeammateMessage,
      phase: "problem_framing",
      badgeKind: "team",
      eventSummary: "Teammate intro",
    });

    await ctx.db.patch(interviewerRuntimeId, {
      lastVisibleMessageId: interviewerMessageId,
    });
    await ctx.db.patch(teammateRuntimeId, {
      lastVisibleMessageId: teammateMessageId,
    });

    return { sessionPublicId: publicId };
  },
});

export const getRoom = query({
  args: { sessionPublicId: v.string() },
  returns: v.union(v.null(), roomValidator),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      return null;
    }

    const channels = await ctx.db
      .query("channels")
      .withIndex("by_sessionId_and_sortOrder", (query) => query.eq("sessionId", session._id))
      .order("asc")
      .take(2);

    const runtimeEntries = await Promise.all(
      channels.map(async (channel) =>
        ctx.db
          .query("agentRuntimeState")
          .withIndex("by_channelId", (query) => query.eq("channelId", channel._id))
          .unique(),
      ),
    );

    const signalState = await getSignalState(ctx, session._id);
    const counters = await getSessionCounters(ctx, session._id);

    if (!signalState || !counters) {
      return null;
    }

    const channelSummaries = channels.map((channel, index) => {
      const runtime = runtimeEntries[index];

      return {
        kind: channel.kind,
        title: channel.title,
        agentRole: channel.agentRole,
        specialization: channel.specialization,
        threadId: channel.threadId,
        status: runtime?.status ?? "idle",
        mode: runtime?.mode ?? "observe",
        lastVisibleMessageId: runtime?.lastVisibleMessageId ?? null,
      };
    });

    return {
      sessionPublicId: session.publicId,
      title: session.title,
      subtitle: session.subtitle,
      candidateName: session.candidateName,
      mode: session.mode,
      status: session.status,
      currentPhase: session.currentPhase,
      startedAt: session.startedAt,
      timeBudgetMs: session.timeBudgetMs,
      rubricVersion: session.rubricVersion,
      channels: channelSummaries,
      signals: {
        requirementsScore: signalState.requirementsScore,
        architectureScore: signalState.architectureScore,
        tradeoffScore: signalState.tradeoffScore,
        collaborationScore: signalState.collaborationScore,
        nudgesGiven: signalState.nudgesGiven,
        updatedAt: signalState.updatedAt,
      },
      counters: {
        nudgeCount: counters.nudgeCount,
        stressCount: counters.stressCount,
        clarificationCount: counters.clarificationCount,
        teammateConcernCount: counters.teammateConcernCount,
      },
    };
  },
});

export const getSessionStatus = query({
  args: { sessionPublicId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      sessionStatus: sessionStatusValidator,
      reportStatus: v.union(
        v.literal("queued"),
        v.literal("analyzing"),
        v.literal("scoring"),
        v.literal("rendering_pdf"),
        v.literal("ready"),
        v.literal("failed"),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      return null;
    }

    const report = await getReportBySessionId(ctx, session._id);

    return {
      sessionStatus: session.status,
      reportStatus: report?.status ?? null,
    };
  },
});

export const endSession = mutation({
  args: { sessionPublicId: v.string() },
  returns: v.object({
    sessionPublicId: v.string(),
    status: sessionStatusValidator,
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    sessionPublicId: string;
    status: Doc<"sessions">["status"];
  }> => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      throw new Error("Session not found.");
    }

    if (session.status !== "active") {
      const currentStatus: Doc<"sessions">["status"] = session.status;
      return {
        sessionPublicId: session.publicId,
        status: currentStatus,
      };
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      status: "generating_report",
      endedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.reportingNode.generateReport, {
      sessionId: session._id,
    });

    const nextStatus: Doc<"sessions">["status"] = "generating_report";
    return {
      sessionPublicId: session.publicId,
      status: nextStatus,
    };
  },
});

export const recordUsage = internalMutation({
  args: {
    threadId: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const channel = await ctx.db
      .query("channels")
      .withIndex("by_threadId", (query) => query.eq("threadId", args.threadId))
      .unique();

    if (!channel) {
      return null;
    }

    const counters = await getSessionCounters(ctx, channel.sessionId);
    if (!counters) {
      return null;
    }

    await ctx.db.patch(counters._id, {
      totalTokens: counters.totalTokens + args.totalTokens,
      totalInputTokens: counters.totalInputTokens + args.inputTokens,
      totalOutputTokens: counters.totalOutputTokens + args.outputTokens,
    });

    return null;
  },
});

async function insertMessage(
  ctx: MutationCtx,
  args: {
    sessionId: Id<"sessions">;
    channelId: Id<"channels">;
    threadId: string;
    speakerType: "interviewer" | "teammate" | "candidate" | "system";
    speakerLabel: string;
    content: string;
    phase: "problem_framing" | "requirements" | "high_level_design" | "deep_dive" | "stress_and_defense" | "wrap_up";
    badgeKind: "brief" | "nudge" | "stress" | "concern" | "clarification" | "team" | "system" | null;
    eventSummary: string | null;
  },
) {
  const counters = await getSessionCounters(ctx, args.sessionId);
  if (!counters) {
    throw new Error("Session counters missing.");
  }

  const sequence = counters.nextSequence + 1;
  const now = Date.now();

  const messageId = await ctx.db.insert("messages", {
    sessionId: args.sessionId,
    channelId: args.channelId,
    threadId: args.threadId,
    sequence,
    speakerType: args.speakerType,
    speakerLabel: args.speakerLabel,
    content: args.content,
    phase: args.phase,
    badgeKind: args.badgeKind,
    eventSummary: args.eventSummary,
    createdAt: now,
    replyToMessageId: null,
    visibleToCandidate: true,
  });

  const counterPatch: Record<string, number> = {
    nextSequence: sequence,
  };

  if (args.speakerType === "candidate") {
    counterPatch.candidateMessageCount = counters.candidateMessageCount + 1;
  }
  if (args.speakerType === "interviewer") {
    counterPatch.interviewerMessageCount = counters.interviewerMessageCount + 1;
  }
  if (args.speakerType === "teammate") {
    counterPatch.teammateMessageCount = counters.teammateMessageCount + 1;
  }

  await ctx.db.patch(counters._id, counterPatch);

  await ctx.db.insert("events", {
    sessionId: args.sessionId,
    channelId: args.channelId,
    messageId,
    type: "message_sent",
    actor: args.speakerType,
    target: null,
    metadataJson: JSON.stringify({
      badgeKind: args.badgeKind,
      eventSummary: args.eventSummary,
      sequence,
    }),
    createdAt: now,
  });

  return messageId;
}
