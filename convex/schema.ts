import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  agentModeValidator,
  agentStatusValidator,
  badgeKindValidator,
  channelKindValidator,
  modeValidator,
  noteLabelValidator,
  phaseValidator,
  recommendationValidator,
  reportStatusValidator,
  sessionFactKindValidator,
  sessionStatusValidator,
  speakerTypeValidator,
} from "./lib/validators";

export default defineSchema({
  sessions: defineTable({
    publicId: v.string(),
    candidateName: v.string(),
    mode: modeValidator,
    status: sessionStatusValidator,
    scenarioId: v.string(),
    scenarioVersion: v.string(),
    rubricVersion: v.string(),
    title: v.string(),
    subtitle: v.string(),
    currentPhase: phaseValidator,
    timeBudgetMs: v.number(),
    startedAt: v.number(),
    endedAt: v.union(v.number(), v.null()),
    interviewerChannelId: v.union(v.id("channels"), v.null()),
    teammateChannelId: v.union(v.id("channels"), v.null()),
    reportId: v.union(v.id("reports"), v.null()),
    teammateSpecialization: v.string(),
    teammateName: v.string(),
  })
    .index("by_publicId", ["publicId"])
    .index("by_status_and_startedAt", ["status", "startedAt"]),

  channels: defineTable({
    sessionId: v.id("sessions"),
    kind: channelKindValidator,
    title: v.string(),
    agentRole: v.string(),
    specialization: v.union(v.string(), v.null()),
    threadId: v.string(),
    sortOrder: v.number(),
  })
    .index("by_sessionId_and_sortOrder", ["sessionId", "sortOrder"])
    .index("by_sessionId_and_kind", ["sessionId", "kind"])
    .index("by_threadId", ["threadId"]),

  messages: defineTable({
    sessionId: v.id("sessions"),
    channelId: v.id("channels"),
    threadId: v.string(),
    sequence: v.number(),
    speakerType: speakerTypeValidator,
    speakerLabel: v.string(),
    content: v.string(),
    phase: phaseValidator,
    badgeKind: badgeKindValidator,
    eventSummary: v.union(v.string(), v.null()),
    createdAt: v.number(),
    replyToMessageId: v.union(v.id("messages"), v.null()),
    visibleToCandidate: v.boolean(),
  })
    .index("by_sessionId_and_sequence", ["sessionId", "sequence"])
    .index("by_channelId_and_sequence", ["channelId", "sequence"])
    .index("by_sessionId_and_createdAt", ["sessionId", "createdAt"]),

  streamingResponses: defineTable({
    sessionId: v.id("sessions"),
    channelId: v.id("channels"),
    status: v.union(v.literal("thinking"), v.literal("streaming")),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_channelId", ["channelId"])
    .index("by_sessionId_and_channelId", ["sessionId", "channelId"]),

  events: defineTable({
    sessionId: v.id("sessions"),
    channelId: v.union(v.id("channels"), v.null()),
    messageId: v.union(v.id("messages"), v.null()),
    type: v.string(),
    actor: v.string(),
    target: v.union(v.string(), v.null()),
    metadataJson: v.string(),
    createdAt: v.number(),
  })
    .index("by_sessionId_and_createdAt", ["sessionId", "createdAt"])
    .index("by_sessionId_and_type_and_createdAt", ["sessionId", "type", "createdAt"])
    .index("by_channelId_and_createdAt", ["channelId", "createdAt"]),

  annotations: defineTable({
    sessionId: v.id("sessions"),
    messageId: v.id("messages"),
    turnSequence: v.number(),
    label: v.string(),
    impact: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
    confidence: v.number(),
    excerpt: v.string(),
    spanStart: v.number(),
    spanEnd: v.number(),
    rationale: v.string(),
    evidenceGroup: v.string(),
  })
    .index("by_sessionId_and_turnSequence", ["sessionId", "turnSequence"])
    .index("by_messageId", ["messageId"])
    .index("by_sessionId_and_label", ["sessionId", "label"]),

  sessionFacts: defineTable({
    sessionId: v.id("sessions"),
    kind: sessionFactKindValidator,
    content: v.string(),
    sourceMessageId: v.id("messages"),
    confidence: v.number(),
    resolved: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_sessionId_and_kind_and_createdAt", ["sessionId", "kind", "createdAt"])
    .index("by_sessionId_and_resolved", ["sessionId", "resolved"]),

  sessionState: defineTable({
    sessionId: v.id("sessions"),
    currentArchitectureSummary: v.string(),
    currentRequirementSummary: v.string(),
    latestRiskSummary: v.string(),
    latestInterviewerChallenge: v.string(),
    latestTeammateConcern: v.string(),
    latestCrossChannelDigest: v.string(),
    updatedAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),

  phaseSummaries: defineTable({
    sessionId: v.id("sessions"),
    phase: phaseValidator,
    summary: v.string(),
    startedAt: v.number(),
    endedAt: v.union(v.number(), v.null()),
  }).index("by_sessionId_and_phase", ["sessionId", "phase"]),

  agentRuntimeState: defineTable({
    sessionId: v.id("sessions"),
    channelId: v.id("channels"),
    agentRole: v.string(),
    status: agentStatusValidator,
    mode: agentModeValidator,
    phase: phaseValidator,
    lastHeartbeatAt: v.number(),
    lastVisibleMessageId: v.union(v.id("messages"), v.null()),
  })
    .index("by_sessionId_and_agentRole", ["sessionId", "agentRole"])
    .index("by_channelId", ["channelId"]),

  signalState: defineTable({
    sessionId: v.id("sessions"),
    requirementsScore: v.number(),
    architectureScore: v.number(),
    tradeoffScore: v.number(),
    collaborationScore: v.number(),
    nudgesGiven: v.number(),
    updatedAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),

  metricSnapshots: defineTable({
    sessionId: v.id("sessions"),
    metricName: v.string(),
    value: v.number(),
    evidenceIds: v.array(v.id("annotations")),
    snapshotType: v.union(v.literal("live"), v.literal("final")),
    createdAt: v.number(),
  }).index("by_sessionId_and_metricName_and_createdAt", [
    "sessionId",
    "metricName",
    "createdAt",
  ]),

  sessionCounters: defineTable({
    sessionId: v.id("sessions"),
    nextSequence: v.number(),
    candidateMessageCount: v.number(),
    interviewerMessageCount: v.number(),
    teammateMessageCount: v.number(),
    nudgeCount: v.number(),
    stressCount: v.number(),
    clarificationCount: v.number(),
    teammateConcernCount: v.number(),
    revisionCount: v.number(),
    hintFishingCount: v.number(),
    totalTokens: v.number(),
    totalInputTokens: v.number(),
    totalOutputTokens: v.number(),
  }).index("by_sessionId", ["sessionId"]),

  scratchNotes: defineTable({
    sessionId: v.id("sessions"),
    label: noteLabelValidator,
    color: v.string(),
    content: v.string(),
    sortOrder: v.number(),
    archived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_sessionId_and_sortOrder", ["sessionId", "sortOrder"]),

  reports: defineTable({
    sessionId: v.id("sessions"),
    status: reportStatusValidator,
    reportJson: v.union(v.string(), v.null()),
    finalRecommendation: v.union(recommendationValidator, v.null()),
    pdfStorageId: v.union(v.id("_storage"), v.null()),
    errorMessage: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_status_and_createdAt", ["status", "createdAt"]),

  reportArtifacts: defineTable({
    reportId: v.id("reports"),
    kind: v.union(v.literal("pdf"), v.literal("transcript_appendix"), v.literal("raw_json")),
    storageId: v.id("_storage"),
    createdAt: v.number(),
  }).index("by_reportId_and_kind", ["reportId", "kind"]),
});
