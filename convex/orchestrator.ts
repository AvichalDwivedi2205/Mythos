import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import {
  getChannelByKind,
  getSessionCounters,
  getSessionState,
  getSolutionWorkspace,
} from "./lib/db";
import {
  approvedClarificationValidator,
  channelKindValidator,
  interviewKindValidator,
  phaseValidator,
  streamingResponseStatusValidator,
} from "./lib/validators";
import type { Doc, Id } from "./_generated/dataModel";
import { parseClarifications } from "../lib/interview-blueprint";
import { computeTimedPhaseFromSession } from "../lib/timed-phase";

const processingContextValidator = v.object({
  sessionPublicId: v.string(),
  interviewKind: interviewKindValidator,
  title: v.string(),
  subtitle: v.string(),
  jobDescription: v.string(),
  resumeSummary: v.string(),
  problemStatement: v.string(),
  sharedContextSeed: v.string(),
  approvedClarifications: v.array(approvedClarificationValidator),
  solutionTemplate: v.string(),
  workingSolution: v.string(),
  mode: v.string(),
  currentPhase: phaseValidator,
  candidateName: v.string(),
  teammateName: v.string(),
  teammateSpecialization: v.string(),
  threadId: v.string(),
  counterpartThreadId: v.string(),
  candidateMessage: v.object({
    id: v.id("messages"),
    sequence: v.number(),
    content: v.string(),
  }),
  sessionState: v.object({
    currentArchitectureSummary: v.string(),
    currentRequirementSummary: v.string(),
    latestRiskSummary: v.string(),
    latestInterviewerChallenge: v.string(),
    latestTeammateConcern: v.string(),
    latestCrossChannelDigest: v.string(),
  }),
  recentTranscript: v.string(),
  scratchPad: v.string(),
  signals: v.object({
    requirementsScore: v.number(),
    architectureScore: v.number(),
    tradeoffScore: v.number(),
    collaborationScore: v.number(),
    nudgesGiven: v.number(),
  }),
});

export const getProcessingContext = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    channelKind: channelKindValidator,
    candidateMessageId: v.id("messages"),
  },
  returns: processingContextValidator,
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session missing.");
    }

    const activeChannel = await getChannelByKind(ctx, args.sessionId, args.channelKind);
    const counterpartKind = args.channelKind === "interviewer" ? "teammate" : "interviewer";
    const counterpartChannel = await getChannelByKind(ctx, args.sessionId, counterpartKind);
    const candidateMessage = await ctx.db.get(args.candidateMessageId);
    const sessionState = await getSessionState(ctx, args.sessionId);
    const solutionWorkspace = await getSolutionWorkspace(ctx, args.sessionId);
    const signals = await ctx.db
      .query("signalState")
      .withIndex("by_sessionId", (query) => query.eq("sessionId", args.sessionId))
      .unique();
    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("by_sessionId_and_sequence", (query) => query.eq("sessionId", args.sessionId))
      .order("desc")
      .take(24);
    const recentNotes = await ctx.db
      .query("scratchNotes")
      .withIndex("by_sessionId_and_sortOrder", (query) => query.eq("sessionId", args.sessionId))
      .order("desc")
      .take(80);

    if (!activeChannel || !counterpartChannel || !candidateMessage || !sessionState || !signals) {
      throw new Error("Interview context is incomplete.");
    }

    const recentTranscript = recentMessages
      .reverse()
      .map(
        (message) =>
          `#${message.sequence} [${message.phase}] ${message.speakerLabel}${
            message.badgeKind ? ` (${message.badgeKind})` : ""
          }: ${message.content}`,
      )
      .join("\n");
    const scratchPad = recentNotes
      .reverse()
      .filter((note) => !note.archived)
      .map((note) => `- [${note.label}] ${note.content}`)
      .join("\n");

    const phaseNow = computeTimedPhaseFromSession(
      session.startedAt,
      session.timeBudgetMs,
      Date.now(),
    );

    return {
      sessionPublicId: session.publicId,
      interviewKind: session.interviewKind ?? "system_design",
      title: session.title,
      subtitle: session.subtitle,
      jobDescription: session.jobDescription ?? "",
      resumeSummary: session.resumeSummary ?? "",
      problemStatement: session.problemStatement ?? session.title,
      sharedContextSeed:
        session.sharedContextSeed ?? sessionState.latestCrossChannelDigest ?? "",
      approvedClarifications: parseClarifications(session.approvedClarificationsJson ?? ""),
      solutionTemplate: solutionWorkspace?.template ?? session.solutionTemplate ?? "",
      workingSolution:
        solutionWorkspace?.finalContent ??
        solutionWorkspace?.draftContent ??
        session.solutionTemplate ??
        "",
      mode: session.mode,
      currentPhase: phaseNow,
      candidateName: session.candidateName,
      teammateName: session.teammateName,
      teammateSpecialization: session.teammateSpecialization,
      threadId: activeChannel.threadId,
      counterpartThreadId: counterpartChannel.threadId,
      candidateMessage: {
        id: candidateMessage._id,
        sequence: candidateMessage.sequence,
        content: candidateMessage.content,
      },
      sessionState: {
        currentArchitectureSummary: sessionState.currentArchitectureSummary,
        currentRequirementSummary: sessionState.currentRequirementSummary,
        latestRiskSummary: sessionState.latestRiskSummary,
        latestInterviewerChallenge: sessionState.latestInterviewerChallenge,
        latestTeammateConcern: sessionState.latestTeammateConcern,
        latestCrossChannelDigest: sessionState.latestCrossChannelDigest,
      },
      recentTranscript,
      scratchPad,
      signals: {
        requirementsScore: signals.requirementsScore,
        architectureScore: signals.architectureScore,
        tradeoffScore: signals.tradeoffScore,
        collaborationScore: signals.collaborationScore,
        nudgesGiven: signals.nudgesGiven,
      },
    };
  },
});

export const persistGeneratedResponse = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    channelId: v.id("channels"),
    channelKind: channelKindValidator,
    responseContent: v.string(),
    responseMode: v.string(),
    badgeKind: v.union(
      v.literal("brief"),
      v.literal("nudge"),
      v.literal("stress"),
      v.literal("concern"),
      v.literal("clarification"),
      v.literal("team"),
      v.literal("system"),
    ),
    eventSummary: v.string(),
    shouldAdvancePhase: v.boolean(),
    nextPhase: v.union(phaseValidator, v.null()),
    usedClarificationBackchannel: v.boolean(),
    clarificationQuestion: v.union(v.string(), v.null()),
  },
  returns: v.object({ responseMessageId: v.id("messages") }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    const channel = await ctx.db.get(args.channelId);
    const counters = await getSessionCounters(ctx, args.sessionId);

    if (!session || !channel || !counters) {
      throw new Error("Cannot persist generated response without session context.");
    }

    const now = Date.now();
    const phaseNow = computeTimedPhaseFromSession(session.startedAt, session.timeBudgetMs, now);
    if (session.currentPhase !== phaseNow) {
      await ctx.db.patch(session._id, { currentPhase: phaseNow });
    }

    const sequence = counters.nextSequence + 1;
    const speakerType = args.channelKind === "interviewer" ? "interviewer" : "teammate";
    const speakerLabel = args.channelKind === "interviewer" ? "Interviewer" : session.teammateName;

    const responseMessageId = await ctx.db.insert("messages", {
      sessionId: args.sessionId,
      channelId: args.channelId,
      threadId: channel.threadId,
      sequence,
      speakerType,
      speakerLabel,
      content: args.responseContent,
      phase: phaseNow,
      badgeKind: args.badgeKind,
      eventSummary: args.eventSummary,
      createdAt: now,
      replyToMessageId: null,
      visibleToCandidate: true,
    });

    const counterPatch: Partial<Doc<"sessionCounters">> = {
      nextSequence: sequence,
    };

    if (args.channelKind === "interviewer") {
      counterPatch.interviewerMessageCount = counters.interviewerMessageCount + 1;
    } else {
      counterPatch.teammateMessageCount = counters.teammateMessageCount + 1;
    }
    if (args.badgeKind === "nudge") {
      counterPatch.nudgeCount = counters.nudgeCount + 1;
    }
    if (args.badgeKind === "stress") {
      counterPatch.stressCount = counters.stressCount + 1;
    }
    if (args.badgeKind === "clarification") {
      counterPatch.clarificationCount = counters.clarificationCount + 1;
    }
    if (args.channelKind === "teammate" && args.badgeKind === "concern") {
      counterPatch.teammateConcernCount = counters.teammateConcernCount + 1;
    }

    await ctx.db.patch(counters._id, counterPatch);

    const runtime = await ctx.db
      .query("agentRuntimeState")
      .withIndex("by_channelId", (query) => query.eq("channelId", args.channelId))
      .unique();
    const streamingResponse = await ctx.db
      .query("streamingResponses")
      .withIndex("by_channelId", (query) => query.eq("channelId", args.channelId))
      .unique();

    if (runtime) {
      await ctx.db.patch(runtime._id, {
        status: "idle",
        mode: normalizeAgentMode(args.responseMode, args.channelKind),
        lastHeartbeatAt: now,
        lastVisibleMessageId: responseMessageId,
      });
    }

    if (streamingResponse) {
      await ctx.db.delete(streamingResponse._id);
    }

    await ctx.db.insert("events", {
      sessionId: args.sessionId,
      channelId: args.channelId,
      messageId: responseMessageId,
      type: "message_sent",
      actor: speakerType,
      target: args.channelKind,
      metadataJson: JSON.stringify({
        badgeKind: args.badgeKind,
        eventSummary: args.eventSummary,
        sequence,
      }),
      createdAt: now,
    });

    if (args.badgeKind === "nudge") {
      await ctx.db.insert("events", {
        sessionId: args.sessionId,
        channelId: args.channelId,
        messageId: responseMessageId,
        type: "interviewer_nudge_issued",
        actor: "interviewer",
        target: "candidate",
        metadataJson: JSON.stringify({ summary: args.eventSummary }),
        createdAt: now,
      });
    }

    if (args.badgeKind === "stress") {
      await ctx.db.insert("events", {
        sessionId: args.sessionId,
        channelId: args.channelId,
        messageId: responseMessageId,
        type: "stress_event_started",
        actor: "interviewer",
        target: "candidate",
        metadataJson: JSON.stringify({ summary: args.eventSummary }),
        createdAt: now,
      });
    }

    if (args.channelKind === "teammate" && args.badgeKind === "concern") {
      await ctx.db.insert("events", {
        sessionId: args.sessionId,
        channelId: args.channelId,
        messageId: responseMessageId,
        type: "teammate_concern_raised",
        actor: "teammate",
        target: "candidate",
        metadataJson: JSON.stringify({
          summary: args.eventSummary,
          teammateName: session.teammateName,
        }),
        createdAt: now,
      });
    }

    if (args.usedClarificationBackchannel && args.clarificationQuestion) {
      await ctx.db.insert("events", {
        sessionId: args.sessionId,
        channelId: args.channelId,
        messageId: responseMessageId,
        type: "teammate_to_interviewer_query",
        actor: "teammate",
        target: "interviewer",
        metadataJson: JSON.stringify({ question: args.clarificationQuestion }),
        createdAt: now,
      });
      await ctx.db.insert("events", {
        sessionId: args.sessionId,
        channelId: args.channelId,
        messageId: responseMessageId,
        type: "interviewer_clarification_to_teammate",
        actor: "interviewer",
        target: "teammate",
        metadataJson: JSON.stringify({ question: args.clarificationQuestion }),
        createdAt: now,
      });
    }

    return { responseMessageId };
  },
});

export const upsertStreamingResponse = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    channelId: v.id("channels"),
    status: streamingResponseStatusValidator,
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const streamingResponse = await ctx.db
      .query("streamingResponses")
      .withIndex("by_channelId", (query) => query.eq("channelId", args.channelId))
      .unique();
    const runtime = await ctx.db
      .query("agentRuntimeState")
      .withIndex("by_channelId", (query) => query.eq("channelId", args.channelId))
      .unique();

    if (streamingResponse) {
      await ctx.db.patch(streamingResponse._id, {
        status: args.status,
        content: args.content,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("streamingResponses", {
        sessionId: args.sessionId,
        channelId: args.channelId,
        status: args.status,
        content: args.content,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (runtime) {
      await ctx.db.patch(runtime._id, {
        status: args.status,
        lastHeartbeatAt: now,
      });
    }

    return null;
  },
});

export const markResponseGenerationFailed = internalMutation({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const streamingResponse = await ctx.db
      .query("streamingResponses")
      .withIndex("by_channelId", (query) => query.eq("channelId", args.channelId))
      .unique();
    const runtime = await ctx.db
      .query("agentRuntimeState")
      .withIndex("by_channelId", (query) => query.eq("channelId", args.channelId))
      .unique();

    if (streamingResponse) {
      await ctx.db.delete(streamingResponse._id);
    }

    if (runtime) {
      await ctx.db.patch(runtime._id, {
        status: "idle",
        lastHeartbeatAt: now,
      });
    }

    return null;
  },
});

export const applyTurnAnalysis = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    candidateMessageId: v.id("messages"),
    responseMessageId: v.id("messages"),
    analysisJson: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const analysis = JSON.parse(args.analysisJson) as {
      currentRequirementSummary: string;
      currentArchitectureSummary: string;
      latestRiskSummary: string;
      latestInterviewerChallenge: string;
      latestTeammateConcern: string;
      latestCrossChannelDigest: string;
      candidateIntegrity?: {
        concernLevel: "none" | "low" | "medium";
        summary: string | null;
        patterns: Array<
          | "solicits_full_solution"
          | "solicits_hidden_rubric_or_ideal_answer"
          | "other_interview_pressure"
        >;
      };
      extractedFacts: Array<{
        kind:
          | "requirement"
          | "clarification"
          | "assumption"
          | "decision"
          | "risk"
          | "open_question"
          | "contradiction";
        content: string;
        resolved: boolean;
        confidence: number;
      }>;
      annotations: Array<{
        label: string;
        impact: "positive" | "negative" | "neutral";
        confidence: number;
        excerpt: string;
        rationale: string;
      }>;
      liveSignals: {
        requirementsScore: number;
        architectureScore: number;
        tradeoffScore: number;
        collaborationScore: number;
      };
    };

    const state = await getSessionState(ctx, args.sessionId);
    const signals = await ctx.db
      .query("signalState")
      .withIndex("by_sessionId", (query) => query.eq("sessionId", args.sessionId))
      .unique();
    const counters = await getSessionCounters(ctx, args.sessionId);
    const responseMessage = await ctx.db.get(args.responseMessageId);

    if (!state || !signals || !counters || !responseMessage) {
      throw new Error("Missing state for turn analysis.");
    }

    const now = Date.now();

    await ctx.db.patch(state._id, {
      currentRequirementSummary: analysis.currentRequirementSummary,
      currentArchitectureSummary: analysis.currentArchitectureSummary,
      latestRiskSummary: analysis.latestRiskSummary,
      latestInterviewerChallenge: analysis.latestInterviewerChallenge,
      latestTeammateConcern: analysis.latestTeammateConcern,
      latestCrossChannelDigest: analysis.latestCrossChannelDigest,
      updatedAt: now,
    });

    for (const fact of analysis.extractedFacts) {
      await ctx.db.insert("sessionFacts", {
        sessionId: args.sessionId,
        kind: fact.kind,
        content: fact.content,
        sourceMessageId: args.responseMessageId,
        confidence: fact.confidence,
        resolved: fact.resolved,
        createdAt: now,
      });
    }

    const annotationIds: Array<Id<"annotations">> = [];
    for (const annotation of analysis.annotations) {
      const excerpt = annotation.excerpt.slice(0, 280);
      const annotationId = await ctx.db.insert("annotations", {
        sessionId: args.sessionId,
        messageId: args.responseMessageId,
        turnSequence: responseMessage.sequence,
        label: annotation.label,
        impact: annotation.impact,
        confidence: annotation.confidence,
        excerpt,
        spanStart: 0,
        spanEnd: excerpt.length,
        rationale: annotation.rationale,
        evidenceGroup: "turn_analysis",
      });
      annotationIds.push(annotationId);
    }

    await ctx.db.patch(signals._id, {
      requirementsScore: Math.round(
        (signals.requirementsScore + analysis.liveSignals.requirementsScore) / 2,
      ),
      architectureScore: Math.round(
        (signals.architectureScore + analysis.liveSignals.architectureScore) / 2,
      ),
      tradeoffScore: Math.round(
        (signals.tradeoffScore + analysis.liveSignals.tradeoffScore) / 2,
      ),
      collaborationScore: Math.round(
        (signals.collaborationScore + analysis.liveSignals.collaborationScore) / 2,
      ),
      nudgesGiven: counters.nudgeCount,
      updatedAt: now,
    });

    await ctx.db.insert("metricSnapshots", {
      sessionId: args.sessionId,
      metricName: "latest_turn_quality",
      value:
        (analysis.liveSignals.requirementsScore +
          analysis.liveSignals.architectureScore +
          analysis.liveSignals.tradeoffScore +
          analysis.liveSignals.collaborationScore) /
        4,
      evidenceIds: annotationIds,
      snapshotType: "live",
      createdAt: now,
    });

    const integrity = analysis.candidateIntegrity ?? {
      concernLevel: "none" as const,
      summary: null,
      patterns: [] as Array<
        "solicits_full_solution" | "solicits_hidden_rubric_or_ideal_answer" | "other_interview_pressure"
      >,
    };
    const seriousIntegrity =
      integrity &&
      (integrity.concernLevel === "medium" ||
        (integrity.concernLevel === "low" &&
          integrity.patterns.some((p) =>
            ["solicits_full_solution", "solicits_hidden_rubric_or_ideal_answer"].includes(p),
          )));
    if (seriousIntegrity && integrity.summary) {
      await ctx.db.insert("events", {
        sessionId: args.sessionId,
        channelId: null,
        messageId: args.candidateMessageId,
        type: "integrity_warning",
        actor: "system",
        target: "candidate",
        metadataJson: JSON.stringify({
          code: "ai_assessed_pressure",
          title: "Interview guardrail",
          detail: integrity.summary,
        }),
        createdAt: now,
      });
    }

    return null;
  },
});

function normalizeAgentMode(
  mode: string,
  channelKind: "interviewer" | "teammate",
):
  | "brief"
  | "probe"
  | "nudge"
  | "challenge"
  | "stress"
  | "close"
  | "collaborate"
  | "clarify_with_interviewer"
  | "observe" {
  if (
    mode === "brief" ||
    mode === "probe" ||
    mode === "nudge" ||
    mode === "challenge" ||
    mode === "stress" ||
    mode === "close" ||
    mode === "collaborate" ||
    mode === "clarify_with_interviewer" ||
    mode === "observe"
  ) {
    return mode;
  }

  return channelKind === "interviewer" ? "probe" : "collaborate";
}
