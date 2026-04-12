import { v } from "convex/values";

export const modeValidator = v.union(
  v.literal("assessment"),
  v.literal("practice"),
  v.literal("coaching"),
);

export const phaseValidator = v.union(
  v.literal("problem_framing"),
  v.literal("requirements"),
  v.literal("high_level_design"),
  v.literal("deep_dive"),
  v.literal("stress_and_defense"),
  v.literal("wrap_up"),
);

export const sessionStatusValidator = v.union(
  v.literal("active"),
  v.literal("ending"),
  v.literal("generating_report"),
  v.literal("completed"),
  v.literal("failed"),
);

export const channelKindValidator = v.union(
  v.literal("interviewer"),
  v.literal("teammate"),
);

export const speakerTypeValidator = v.union(
  v.literal("candidate"),
  v.literal("interviewer"),
  v.literal("teammate"),
  v.literal("system"),
);

export const badgeKindValidator = v.union(
  v.literal("brief"),
  v.literal("nudge"),
  v.literal("stress"),
  v.literal("concern"),
  v.literal("clarification"),
  v.literal("team"),
  v.literal("system"),
  v.null(),
);

export const agentStatusValidator = v.union(
  v.literal("idle"),
  v.literal("thinking"),
  v.literal("streaming"),
  v.literal("waiting"),
  v.literal("blocked"),
);

export const streamingResponseStatusValidator = v.union(
  v.literal("thinking"),
  v.literal("streaming"),
);

export const agentModeValidator = v.union(
  v.literal("brief"),
  v.literal("probe"),
  v.literal("nudge"),
  v.literal("challenge"),
  v.literal("stress"),
  v.literal("close"),
  v.literal("collaborate"),
  v.literal("clarify_with_interviewer"),
  v.literal("observe"),
);

export const reportStatusValidator = v.union(
  v.literal("queued"),
  v.literal("analyzing"),
  v.literal("scoring"),
  v.literal("rendering_pdf"),
  v.literal("ready"),
  v.literal("failed"),
);

export const noteLabelValidator = v.union(
  v.literal("Requirement"),
  v.literal("Constraint"),
  v.literal("Design note"),
  v.literal("Open question"),
  v.literal("Assumption"),
  v.literal("To revisit"),
);

export const sessionFactKindValidator = v.union(
  v.literal("requirement"),
  v.literal("clarification"),
  v.literal("assumption"),
  v.literal("decision"),
  v.literal("risk"),
  v.literal("open_question"),
  v.literal("contradiction"),
);

export const recommendationValidator = v.union(
  v.literal("strong_hire"),
  v.literal("hire"),
  v.literal("lean_hire"),
  v.literal("no_hire"),
  v.literal("inconclusive"),
);

export const annotationImpactValidator = v.union(
  v.literal("positive"),
  v.literal("negative"),
  v.literal("neutral"),
);

export const visibleMessageValidator = v.object({
  id: v.id("messages"),
  sequence: v.number(),
  speakerType: speakerTypeValidator,
  speakerLabel: v.string(),
  content: v.string(),
  phase: phaseValidator,
  badgeKind: badgeKindValidator,
  eventSummary: v.union(v.string(), v.null()),
  createdAt: v.number(),
});

export const streamingResponseValidator = v.object({
  status: streamingResponseStatusValidator,
  content: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const approvedClarificationValidator = v.object({
  key: v.string(),
  value: v.string(),
  keywords: v.array(v.string()),
});

export const integrityWarningValidator = v.object({
  code: v.union(
    v.literal("full_solution_request"),
    v.literal("hidden_rubric_request"),
    v.literal("direct_answer_request"),
  ),
  title: v.string(),
  detail: v.string(),
  severity: v.union(v.literal("warning"), v.literal("critical")),
  blocked: v.boolean(),
});

export const sendCandidateMessageResultValidator = v.object({
  queued: v.boolean(),
  blocked: v.boolean(),
  messageId: v.union(v.id("messages"), v.null()),
  warning: v.union(v.null(), integrityWarningValidator),
});

export const channelSummaryValidator = v.object({
  kind: channelKindValidator,
  title: v.string(),
  agentRole: v.string(),
  specialization: v.union(v.string(), v.null()),
  threadId: v.string(),
  status: agentStatusValidator,
  mode: agentModeValidator,
  lastVisibleMessageId: v.union(v.id("messages"), v.null()),
});

export const signalStateValidator = v.object({
  requirementsScore: v.number(),
  architectureScore: v.number(),
  tradeoffScore: v.number(),
  collaborationScore: v.number(),
  nudgesGiven: v.number(),
  updatedAt: v.number(),
});

export const scratchNoteValidator = v.object({
  id: v.id("scratchNotes"),
  label: noteLabelValidator,
  color: v.string(),
  content: v.string(),
  sortOrder: v.number(),
  archived: v.boolean(),
});

export const solutionWorkspaceViewValidator = v.object({
  template: v.string(),
  draftContent: v.string(),
  finalContent: v.union(v.string(), v.null()),
  finalSubmittedAt: v.union(v.number(), v.null()),
  updatedAt: v.number(),
});

export const workspaceNotificationValidator = v.object({
  type: v.string(),
  title: v.string(),
  detail: v.string(),
  createdAt: v.number(),
});

export const sharedWorkspaceValidator = v.object({
  sessionPublicId: v.string(),
  jobDescription: v.string(),
  resumeSummary: v.string(),
  problemStatement: v.string(),
  sharedContextSeed: v.string(),
  approvedClarifications: v.array(approvedClarificationValidator),
  currentRequirementSummary: v.string(),
  currentArchitectureSummary: v.string(),
  latestRiskSummary: v.string(),
  latestInterviewerChallenge: v.string(),
  latestTeammateConcern: v.string(),
  latestCrossChannelDigest: v.string(),
  notifications: v.array(workspaceNotificationValidator),
  solution: solutionWorkspaceViewValidator,
});

export const roomValidator = v.object({
  sessionPublicId: v.string(),
  title: v.string(),
  subtitle: v.string(),
  candidateName: v.string(),
  mode: modeValidator,
  status: sessionStatusValidator,
  currentPhase: phaseValidator,
  startedAt: v.number(),
  timeBudgetMs: v.number(),
  rubricVersion: v.string(),
  channels: v.array(channelSummaryValidator),
  signals: signalStateValidator,
  counters: v.object({
    nudgeCount: v.number(),
    stressCount: v.number(),
    clarificationCount: v.number(),
    teammateConcernCount: v.number(),
  }),
});

export const reportViewValidator = v.object({
  sessionPublicId: v.string(),
  status: reportStatusValidator,
  reportJson: v.union(v.string(), v.null()),
  finalRecommendation: v.union(recommendationValidator, v.null()),
  pdfUrl: v.union(v.string(), v.null()),
  updatedAt: v.number(),
});
