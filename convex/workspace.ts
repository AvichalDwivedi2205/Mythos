import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getSessionByPublicId, getSessionState, getSolutionWorkspace } from "./lib/db";
import { sharedWorkspaceValidator } from "./lib/validators";
import { parseClarifications } from "../lib/interview-blueprint";

export const getSharedWorkspace = query({
  args: { sessionPublicId: v.string() },
  returns: v.union(v.null(), sharedWorkspaceValidator),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      return null;
    }

    const [sessionState, solutionWorkspace, recentEvents] = await Promise.all([
      getSessionState(ctx, session._id),
      getSolutionWorkspace(ctx, session._id),
      ctx.db
        .query("events")
        .withIndex("by_sessionId_and_createdAt", (query) => query.eq("sessionId", session._id))
        .order("desc")
        .take(24),
    ]);

    const notifications = recentEvents
      .map((event) => mapEventToNotification(event.type, event.metadataJson, event.createdAt))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .slice(0, 8);

    return {
      sessionPublicId: session.publicId,
      jobDescription: session.jobDescription ?? "",
      resumeSummary: session.resumeSummary ?? "",
      problemStatement: session.problemStatement ?? "",
      sharedContextSeed:
        session.sharedContextSeed ?? sessionState?.latestCrossChannelDigest ?? "",
      approvedClarifications: parseClarifications(session.approvedClarificationsJson ?? ""),
      currentRequirementSummary: sessionState?.currentRequirementSummary ?? "",
      currentArchitectureSummary: sessionState?.currentArchitectureSummary ?? "",
      latestRiskSummary: sessionState?.latestRiskSummary ?? "",
      latestInterviewerChallenge: sessionState?.latestInterviewerChallenge ?? "",
      latestTeammateConcern: sessionState?.latestTeammateConcern ?? "",
      latestCrossChannelDigest: sessionState?.latestCrossChannelDigest ?? "",
      notifications,
      solution: {
        template: solutionWorkspace?.template ?? session.solutionTemplate ?? "",
        draftContent:
          solutionWorkspace?.draftContent ??
          solutionWorkspace?.finalContent ??
          session.solutionTemplate ??
          "",
        finalContent: solutionWorkspace?.finalContent ?? null,
        finalSubmittedAt: solutionWorkspace?.finalSubmittedAt ?? null,
        updatedAt: solutionWorkspace?.updatedAt ?? session.startedAt,
      },
    };
  },
});

export const saveSolutionDraft = mutation({
  args: {
    sessionPublicId: v.string(),
    draftContent: v.string(),
  },
  returns: v.object({
    updatedAt: v.number(),
    finalSubmittedAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      throw new Error("Session not found.");
    }

    const workspace = await getSolutionWorkspace(ctx, session._id);
    const now = Date.now();
    const nextDraft = args.draftContent.trim();

    if (workspace) {
      await ctx.db.patch(workspace._id, {
        draftContent: nextDraft,
        updatedAt: now,
      });
      return {
        updatedAt: now,
        finalSubmittedAt: workspace.finalSubmittedAt,
      };
    }

    await ctx.db.insert("solutionWorkspaces", {
      sessionId: session._id,
      template: session.solutionTemplate ?? "",
      draftContent: nextDraft,
      finalContent: null,
      finalSubmittedAt: null,
      updatedAt: now,
    });

    return {
      updatedAt: now,
      finalSubmittedAt: null,
    };
  },
});

export const submitFinalSolution = mutation({
  args: {
    sessionPublicId: v.string(),
    content: v.string(),
  },
  returns: v.object({ submittedAt: v.number() }),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      throw new Error("Session not found.");
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Final solution cannot be empty.");
    }

    const now = Date.now();
    const workspace = await getSolutionWorkspace(ctx, session._id);

    if (workspace) {
      await ctx.db.patch(workspace._id, {
        draftContent: content,
        finalContent: content,
        finalSubmittedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("solutionWorkspaces", {
        sessionId: session._id,
        template: session.solutionTemplate ?? "",
        draftContent: content,
        finalContent: content,
        finalSubmittedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("events", {
      sessionId: session._id,
      channelId: null,
      messageId: null,
      type: "final_solution_submitted",
      actor: "candidate",
      target: "workspace",
      metadataJson: JSON.stringify({
        title: "Final solution submitted",
        detail: "The candidate locked their final answer for review.",
      }),
      createdAt: now,
    });

    return { submittedAt: now };
  },
});

function mapEventToNotification(type: string, metadataJson: string, createdAt: number) {
  const metadata = parseMetadata(metadataJson);

  if (type === "stress_event_started") {
    return {
      type,
      title: "Stress test live",
      detail:
        metadata.summary ??
        "The interviewer is pressure-testing the current design. Tighten the tradeoffs and failure story.",
      createdAt,
    };
  }

  if (type === "teammate_concern_raised") {
    const name = metadata.teammateName ?? "Your teammate";
    return {
      type,
      title: `${name} pushed on a risk`,
      detail: metadata.summary ?? "Your teammate surfaced a design concern that needs an answer.",
      createdAt,
    };
  }

  if (type === "interviewer_nudge_issued") {
    return {
      type,
      title: "Interviewer nudge",
      detail: metadata.summary ?? "The interviewer is nudging the discussion back toward a missing area.",
      createdAt,
    };
  }

  if (type === "interviewer_check_in") {
    return {
      type,
      title: metadata.title ?? "Interviewer check-in",
      detail: metadata.detail ?? "Timed pulse from the interviewer channel.",
      createdAt,
    };
  }

  if (type === "integrity_warning") {
    return {
      type,
      title: metadata.title ?? "Interview warning",
      detail:
        metadata.detail ??
        "The message crossed an interview guardrail. Rephrase it around a specific tradeoff or design slice.",
      createdAt,
    };
  }

  if (type === "final_solution_submitted") {
    return {
      type,
      title: metadata.title ?? "Final solution submitted",
      detail: metadata.detail ?? "Your latest final answer is saved and ready for evaluation.",
      createdAt,
    };
  }

  if (type === "message_sent" && metadata.badgeKind === "concern") {
    return {
      type,
      title: "Teammate interaction",
      detail: metadata.eventSummary ?? "Your teammate added pressure on the current plan.",
      createdAt,
    };
  }

  return null;
}

function parseMetadata(metadataJson: string) {
  try {
    const parsed = JSON.parse(metadataJson) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {} as Record<string, string>;
  }
}
