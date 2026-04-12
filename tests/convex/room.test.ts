import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "@/convex/schema";
import { api, internal } from "@/convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.{ts,tsx}");

describe("convex room flows", () => {
  it("reads a seeded room snapshot", async () => {
    const t = convexTest({ schema, modules });

    const seeded = await t.run(async (ctx) => {
      const sessionId = await ctx.db.insert("sessions", {
        publicId: "session-seeded",
        candidateName: "Avi",
        mode: "practice",
        status: "active",
        scenarioId: "real-time-chat-at-scale",
        scenarioVersion: "2026-04-12",
        rubricVersion: "v2.1",
        title: "Real-Time Chat at Scale",
        subtitle: "System Design · Senior Engineer",
        currentPhase: "requirements",
        timeBudgetMs: 1800000,
        startedAt: 1710000000000,
        endedAt: null,
        interviewerChannelId: null,
        teammateChannelId: null,
        reportId: null,
        teammateSpecialization: "sre_infra",
        teammateName: "Priya",
      });

      const interviewerChannelId = await ctx.db.insert("channels", {
        sessionId,
        kind: "interviewer",
        title: "Interviewer",
        agentRole: "Interviewer",
        specialization: null,
        threadId: "thread-interviewer",
        sortOrder: 0,
      });

      const teammateChannelId = await ctx.db.insert("channels", {
        sessionId,
        kind: "teammate",
        title: "Priya · SRE",
        agentRole: "Priya",
        specialization: "SRE · Infra",
        threadId: "thread-teammate",
        sortOrder: 1,
      });

      await ctx.db.patch(sessionId, {
        interviewerChannelId,
        teammateChannelId,
      });

      await ctx.db.insert("signalState", {
        sessionId,
        requirementsScore: 60,
        architectureScore: 51,
        tradeoffScore: 44,
        collaborationScore: 57,
        nudgesGiven: 1,
        updatedAt: 1710000000000,
      });

      await ctx.db.insert("sessionCounters", {
        sessionId,
        nextSequence: 2,
        candidateMessageCount: 1,
        interviewerMessageCount: 1,
        teammateMessageCount: 0,
        nudgeCount: 1,
        stressCount: 0,
        clarificationCount: 0,
        teammateConcernCount: 0,
        revisionCount: 0,
        hintFishingCount: 0,
        totalTokens: 10,
        totalInputTokens: 6,
        totalOutputTokens: 4,
      });

      await ctx.db.insert("agentRuntimeState", {
        sessionId,
        channelId: interviewerChannelId,
        agentRole: "Interviewer",
        status: "idle",
        mode: "probe",
        phase: "requirements",
        lastHeartbeatAt: 1710000000000,
        lastVisibleMessageId: null,
      });

      await ctx.db.insert("agentRuntimeState", {
        sessionId,
        channelId: teammateChannelId,
        agentRole: "Priya",
        status: "thinking",
        mode: "collaborate",
        phase: "requirements",
        lastHeartbeatAt: 1710000000000,
        lastVisibleMessageId: null,
      });

      return { sessionId };
    });

    expect(seeded.sessionId).toBeTruthy();

    const room = await t.query(api.sessions.getRoom, {
      sessionPublicId: "session-seeded",
    });

    expect(room?.title).toBe("Real-Time Chat at Scale");
    expect(room?.channels).toHaveLength(2);
    expect(room?.signals.requirementsScore).toBe(60);
  });

  it("creates, updates, and deletes notes against a seeded session", async () => {
    const t = convexTest({ schema, modules });

    await t.run(async (ctx) => {
      await ctx.db.insert("sessions", {
        publicId: "session-notes",
        candidateName: "Avi",
        mode: "practice",
        status: "active",
        scenarioId: "real-time-chat-at-scale",
        scenarioVersion: "2026-04-12",
        rubricVersion: "v2.1",
        title: "Real-Time Chat at Scale",
        subtitle: "System Design · Senior Engineer",
        currentPhase: "problem_framing",
        timeBudgetMs: 1800000,
        startedAt: 1710000000000,
        endedAt: null,
        interviewerChannelId: null,
        teammateChannelId: null,
        reportId: null,
        teammateSpecialization: "sre_infra",
        teammateName: "Priya",
      });
    });

    const noteId = await t.mutation(api.notes.createNote, {
      sessionPublicId: "session-notes",
      label: "Design note",
      color: "#bbf7d0",
      content: "WebSocket edge tier handles connection fan-out.",
    });

    await t.mutation(api.notes.updateNote, {
      noteId,
      label: "Open question",
      content: "Need a final answer on per-conversation sequencing.",
    });

    const updatedNotes = await t.query(api.notes.listNotes, {
      sessionPublicId: "session-notes",
    });

    expect(updatedNotes).toHaveLength(1);
    expect(updatedNotes[0]?.label).toBe("Open question");

    await t.mutation(api.notes.deleteNote, { noteId });

    const finalNotes = await t.query(api.notes.listNotes, {
      sessionPublicId: "session-notes",
    });

    expect(finalNotes).toEqual([]);
  });

  it("includes recent transcript and scratch pad context for the agent runtime", async () => {
    const t = convexTest({ schema, modules });

    const seeded = await t.run(async (ctx) => {
      const sessionId = await ctx.db.insert("sessions", {
        publicId: "session-context",
        candidateName: "Avi",
        mode: "practice",
        status: "active",
        scenarioId: "real-time-chat-at-scale",
        scenarioVersion: "2026-04-12",
        rubricVersion: "v2.1",
        title: "Real-Time Chat at Scale",
        subtitle: "System Design · Senior Engineer",
        currentPhase: "high_level_design",
        timeBudgetMs: 1800000,
        startedAt: 1710000000000,
        endedAt: null,
        interviewerChannelId: null,
        teammateChannelId: null,
        reportId: null,
        teammateSpecialization: "sre_infra",
        teammateName: "Priya",
      });

      const interviewerChannelId = await ctx.db.insert("channels", {
        sessionId,
        kind: "interviewer",
        title: "Interviewer",
        agentRole: "Interviewer",
        specialization: null,
        threadId: "thread-interviewer",
        sortOrder: 0,
      });

      const teammateChannelId = await ctx.db.insert("channels", {
        sessionId,
        kind: "teammate",
        title: "Priya · SRE",
        agentRole: "Priya",
        specialization: "SRE · Infra",
        threadId: "thread-teammate",
        sortOrder: 1,
      });

      await ctx.db.patch(sessionId, {
        interviewerChannelId,
        teammateChannelId,
      });

      await ctx.db.insert("sessionState", {
        sessionId,
        currentArchitectureSummary: "Gateway to Kafka to Cassandra.",
        currentRequirementSummary: "Need strong per-conversation ordering.",
        latestRiskSummary: "Leader failover can stall fan-out.",
        latestInterviewerChallenge: "How are message IDs assigned?",
        latestTeammateConcern: "Cross-node routing needs a stable strategy.",
        latestCrossChannelDigest: "Ordering and failover are still open.",
        updatedAt: 1710000000000,
      });

      await ctx.db.insert("signalState", {
        sessionId,
        requirementsScore: 64,
        architectureScore: 59,
        tradeoffScore: 48,
        collaborationScore: 61,
        nudgesGiven: 1,
        updatedAt: 1710000000000,
      });

      await ctx.db.insert("sessionCounters", {
        sessionId,
        nextSequence: 4,
        candidateMessageCount: 2,
        interviewerMessageCount: 1,
        teammateMessageCount: 1,
        nudgeCount: 1,
        stressCount: 0,
        clarificationCount: 0,
        teammateConcernCount: 1,
        revisionCount: 0,
        hintFishingCount: 0,
        totalTokens: 42,
        totalInputTokens: 25,
        totalOutputTokens: 17,
      });

      await ctx.db.insert("messages", {
        sessionId,
        channelId: interviewerChannelId,
        threadId: "thread-interviewer",
        sequence: 1,
        speakerType: "interviewer",
        speakerLabel: "Interviewer",
        content: "Walk me through the shape of the system first.",
        phase: "problem_framing",
        badgeKind: "brief",
        eventSummary: "Brief",
        createdAt: 1710000000001,
        replyToMessageId: null,
        visibleToCandidate: true,
      });

      await ctx.db.insert("messages", {
        sessionId,
        channelId: teammateChannelId,
        threadId: "thread-teammate",
        sequence: 2,
        speakerType: "teammate",
        speakerLabel: "Priya",
        content: "Be explicit about cross-node fan-out and failure handling.",
        phase: "requirements",
        badgeKind: "concern",
        eventSummary: "Concern raised",
        createdAt: 1710000000002,
        replyToMessageId: null,
        visibleToCandidate: true,
      });

      await ctx.db.insert("messages", {
        sessionId,
        channelId: interviewerChannelId,
        threadId: "thread-interviewer",
        sequence: 3,
        speakerType: "candidate",
        speakerLabel: "You",
        content: "I want Kafka in the middle, but I still need an ordering story.",
        phase: "high_level_design",
        badgeKind: null,
        eventSummary: null,
        createdAt: 1710000000003,
        replyToMessageId: null,
        visibleToCandidate: true,
      });

      const candidateMessageId = await ctx.db.insert("messages", {
        sessionId,
        channelId: interviewerChannelId,
        threadId: "thread-interviewer",
        sequence: 4,
        speakerType: "candidate",
        speakerLabel: "You",
        content: "I would shard by conversation, but I still need a durable message ID strategy.",
        phase: "high_level_design",
        badgeKind: null,
        eventSummary: null,
        createdAt: 1710000000004,
        replyToMessageId: null,
        visibleToCandidate: true,
      });

      await ctx.db.insert("scratchNotes", {
        sessionId,
        label: "Open question",
        color: "#bfdbfe",
        content: "Need a message ID scheme that preserves per-conversation ordering.",
        sortOrder: 0,
        archived: false,
        createdAt: 1710000000005,
        updatedAt: 1710000000005,
      });

      return { sessionId, candidateMessageId };
    });

    const context = await t.query(internal.orchestrator.getProcessingContext, {
      sessionId: seeded.sessionId,
      channelKind: "interviewer",
      candidateMessageId: seeded.candidateMessageId,
    });

    expect(context.recentTranscript).toContain("#2 [requirements] Priya (concern)");
    expect(context.recentTranscript).toContain("durable message ID strategy");
    expect(context.scratchPad).toContain("[Open question] Need a message ID scheme");
  });
});
