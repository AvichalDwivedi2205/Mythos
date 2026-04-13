"use node";

import { createThread } from "@convex-dev/agent";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { generateFinalReport, generateTurnAnalysis, generateVisibleResponse } from "./aiRuntime";

export const aiSmokeTest = action({
  args: {},
  returns: v.object({
    interviewerContent: v.string(),
    interviewerBadge: v.string(),
    teammateContent: v.string(),
    teammateBadge: v.string(),
    reportRecommendation: v.string(),
    reportSummary: v.string(),
  }),
  handler: async (ctx) => {
    const interviewerThreadId = await createThread(ctx, components.agent as never, {
      title: "ai-smoke-interviewer",
      userId: "ai-smoke-test",
      summary: "AI smoke interviewer thread",
    });
    const teammateThreadId = await createThread(ctx, components.agent as never, {
      title: "ai-smoke-teammate",
      userId: "ai-smoke-test",
      summary: "AI smoke teammate thread",
    });

    const baseContext = {
      sessionPublicId: "test-session",
      interviewKind: "system_design" as const,
      title: "Real-Time Chat at Scale",
      subtitle: "System Design · Senior Engineer",
      jobDescription: "Senior backend: real-time messaging and presence.",
      resumeSummary: "Prior experience with distributed systems and chat backends.",
      problemStatement: "Design a global messaging platform with ordering and offline delivery.",
      sharedContextSeed: "Candidate background: distributed systems. Job focus: messaging.",
      approvedClarifications: [
        {
          key: "ordering",
          keywords: ["order", "ordering"],
          value: "Strong ordering is required within each conversation.",
        },
      ],
      solutionTemplate: "# Final Solution Outline\n\n## High-Level Architecture\n- ...",
      workingSolution: "# Final Solution Outline\n\nDraft with WebSocket + Kafka noted.",
      mode: "assessment",
      currentPhase: "high_level_design",
      candidateName: "Test Candidate",
      teammateName: "Priya",
      teammateSpecialization: "sre_infra",
      threadId: interviewerThreadId,
      counterpartThreadId: teammateThreadId,
      candidateMessage: {
        id: "message-1",
        sequence: 7,
        content:
          "I'm thinking WebSocket gateways, Kafka for fan-out, Cassandra for message storage, and Redis for presence.",
      },
      sessionState: {
        currentArchitectureSummary:
          "WebSocket gateways, Kafka fan-out, Cassandra storage, Redis presence.",
        currentRequirementSummary:
          "Global scale, 10M concurrent users, strong ordering per conversation, 7-day offline delivery.",
        latestRiskSummary: "Ordering strategy has not been fully specified.",
        latestInterviewerChallenge: "",
        latestTeammateConcern: "",
        latestCrossChannelDigest:
          "Candidate has a plausible high-level architecture but has not defended ordering yet.",
      },
      recentTranscript:
        "#5 [requirements] Interviewer (brief): Clarify the ordering guarantees and offline delivery constraints.\n#6 [requirements] Priya (concern): Pressure-test reconnect routing and fan-out failover.\n#7 [high_level_design] You: I'm thinking WebSocket gateways, Kafka for fan-out, Cassandra for message storage, and Redis for presence.",
      scratchPad:
        "- [Requirement] Strong ordering within each conversation\n- [Constraint] Offline delivery within a 7-day window\n- [Open question] Durable message ID strategy for Cassandra ordering",
      signals: {
        requirementsScore: 70,
        architectureScore: 58,
        tradeoffScore: 42,
        collaborationScore: 61,
        nudgesGiven: 1,
      },
      fullSolutionSolicitationCount: 0,
    };

    const interviewer = await generateVisibleResponse(ctx, {
      channelKind: "interviewer",
      context: baseContext,
    });

    const teammate = await generateVisibleResponse(ctx, {
      channelKind: "teammate",
      context: {
        ...baseContext,
        threadId: teammateThreadId,
      },
    });

    const analysis = await generateTurnAnalysis(baseContext, {
      responseContent: interviewer.content,
      responseBadgeKind: interviewer.badgeKind,
    });

    const report = await generateFinalReport({
      interviewKind: baseContext.interviewKind,
      sessionTitle: baseContext.title,
      subtitle: baseContext.subtitle,
      candidateName: baseContext.candidateName,
      mode: baseContext.mode,
      transcriptText: `#7 Candidate: ${baseContext.candidateMessage.content}\n#8 Interviewer: ${interviewer.content}\n#9 Teammate: ${teammate.content}`,
      annotationsText: analysis.annotations
        .map((entry) => `${entry.label}: ${entry.excerpt} -> ${entry.rationale}`)
        .join("\n"),
      countersText: JSON.stringify({ nudgeCount: 1, stressCount: 0, teammateConcernCount: 1 }),
      currentStateText: JSON.stringify(analysis),
      finalSolutionText: baseContext.workingSolution,
    });

    return {
      interviewerContent: interviewer.content,
      interviewerBadge: interviewer.badgeKind,
      teammateContent: teammate.content,
      teammateBadge: teammate.badgeKind,
      reportRecommendation: report.finalRecommendation,
      reportSummary: report.summary,
    };
  },
});
