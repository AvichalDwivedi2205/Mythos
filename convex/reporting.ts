import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { getReportBySessionId, getSolutionWorkspace } from "./lib/db";
import { recommendationValidator } from "./lib/validators";

const reportContextValidator = v.object({
  sessionPublicId: v.string(),
  sessionTitle: v.string(),
  subtitle: v.string(),
  candidateName: v.string(),
  mode: v.string(),
  transcriptText: v.string(),
  annotationsText: v.string(),
  countersText: v.string(),
  currentStateText: v.string(),
  finalSolutionText: v.string(),
});

export const getReportContext = internalQuery({
  args: { sessionId: v.id("sessions") },
  returns: reportContextValidator,
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_sessionId_and_sequence", (query) => query.eq("sessionId", args.sessionId))
      .order("asc")
      .take(500);

    const annotations = await ctx.db
      .query("annotations")
      .withIndex("by_sessionId_and_turnSequence", (query) => query.eq("sessionId", args.sessionId))
      .order("asc")
      .take(400);

    const [counters, sessionState, solutionWorkspace] = await Promise.all([
      ctx.db
        .query("sessionCounters")
        .withIndex("by_sessionId", (query) => query.eq("sessionId", args.sessionId))
        .unique(),
      ctx.db
        .query("sessionState")
        .withIndex("by_sessionId", (query) => query.eq("sessionId", args.sessionId))
        .unique(),
      getSolutionWorkspace(ctx, args.sessionId),
    ]);

    const transcriptText = messages
      .map(
        (message) =>
          `#${message.sequence} [${message.phase}] ${message.speakerLabel}${
            message.badgeKind ? ` (${message.badgeKind})` : ""
          }: ${message.content}`,
      )
      .join("\n");

    const annotationsText = annotations
      .map(
        (annotation) =>
          `#${annotation.turnSequence} ${annotation.label} ${annotation.impact} (${annotation.confidence.toFixed(2)}): ${annotation.excerpt} -> ${annotation.rationale}`,
      )
      .join("\n");

    const countersText = counters
      ? JSON.stringify(
          {
            candidateMessageCount: counters.candidateMessageCount,
            interviewerMessageCount: counters.interviewerMessageCount,
            teammateMessageCount: counters.teammateMessageCount,
            nudgeCount: counters.nudgeCount,
            stressCount: counters.stressCount,
            clarificationCount: counters.clarificationCount,
            teammateConcernCount: counters.teammateConcernCount,
            totalTokens: counters.totalTokens,
          },
          null,
          2,
        )
      : "{}";

    const currentStateText = sessionState
      ? JSON.stringify(
          {
            currentRequirementSummary: sessionState.currentRequirementSummary,
            currentArchitectureSummary: sessionState.currentArchitectureSummary,
            latestRiskSummary: sessionState.latestRiskSummary,
            latestInterviewerChallenge: sessionState.latestInterviewerChallenge,
            latestTeammateConcern: sessionState.latestTeammateConcern,
            latestCrossChannelDigest: sessionState.latestCrossChannelDigest,
            problemStatement: session.problemStatement ?? "",
            resumeSummary: session.resumeSummary ?? "",
            jobDescription: session.jobDescription ?? "",
          },
          null,
          2,
        )
      : "{}";

    return {
      sessionPublicId: session.publicId,
      sessionTitle: session.title,
      subtitle: session.subtitle,
      candidateName: session.candidateName,
      mode: session.mode,
      transcriptText,
      annotationsText,
      countersText,
      currentStateText,
      finalSolutionText:
        solutionWorkspace?.finalContent ??
        solutionWorkspace?.draftContent ??
        session.solutionTemplate ??
        "",
    };
  },
});

export const ensureReportRow = internalMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.id("reports"),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }

    const existing = await getReportBySessionId(ctx, args.sessionId);
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "analyzing",
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const reportId = await ctx.db.insert("reports", {
      sessionId: args.sessionId,
      status: "analyzing",
      reportJson: null,
      finalRecommendation: null,
      pdfStorageId: null,
      errorMessage: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(session._id, {
      reportId,
    });

    return reportId;
  },
});

export const persistGeneratedReport = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    reportJson: v.string(),
    finalRecommendation: recommendationValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = await getReportBySessionId(ctx, args.sessionId);
    const session = await ctx.db.get(args.sessionId);

    if (!report || !session) {
      throw new Error("Cannot persist report without report row and session.");
    }

    await ctx.db.patch(report._id, {
      status: "ready",
      reportJson: args.reportJson,
      finalRecommendation: args.finalRecommendation,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(session._id, {
      status: "completed",
    });

    return null;
  },
});
