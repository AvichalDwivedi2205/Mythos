import { z } from "zod";

export const visibleResponseModes = [
  "brief",
  "probe",
  "nudge",
  "challenge",
  "stress",
  "close",
  "collaborate",
  "clarify_with_interviewer",
  "observe",
] as const;

export const visibleResponseBadgeKinds = [
  "brief",
  "nudge",
  "stress",
  "concern",
  "clarification",
  "team",
  "system",
] as const;

export const interviewPhaseValues = [
  "problem_framing",
  "requirements",
  "high_level_design",
  "deep_dive",
  "stress_and_defense",
  "wrap_up",
] as const;

export const visibleAgentResponseSchema = z.object({
  mode: z.enum(visibleResponseModes),
  badgeKind: z.enum(visibleResponseBadgeKinds),
  content: z.string().min(8).max(2000),
  eventSummary: z.string().min(3).max(160),
  shouldAdvancePhase: z.boolean().default(false),
  nextPhase: z.enum(interviewPhaseValues).nullable().default(null),
  needsClarification: z.boolean().default(false),
  clarificationQuestion: z.string().nullable().default(null),
});

export const visibleAgentResponseDraftSchema = z.object({
  mode: z.string().optional(),
  badgeKind: z.string().optional(),
  content: z.string().optional(),
  eventSummary: z.string().optional(),
  shouldAdvancePhase: z.boolean().optional(),
  nextPhase: z.string().nullable().optional(),
  needsClarification: z.boolean().optional(),
  clarificationQuestion: z.string().nullable().optional(),
});

/** Stricter schema for LLM structured output — Gemini otherwise returns `{}`-like partials and stops. */
export const visibleAgentResponseGenerationSchema = visibleAgentResponseDraftSchema.extend({
  content: z
    .string()
    .min(8)
    .max(2000)
    .describe(
      "Required. The full candidate-visible reply with at least one complete sentence (not a placeholder).",
    ),
});

export const turnAnalysisSchema = z.object({
  currentRequirementSummary: z.string().min(0).max(500),
  currentArchitectureSummary: z.string().min(0).max(700),
  latestRiskSummary: z.string().min(0).max(500),
  latestInterviewerChallenge: z.string().min(0).max(300),
  latestTeammateConcern: z.string().min(0).max(300),
  latestCrossChannelDigest: z.string().min(0).max(700),
  extractedFacts: z.array(
    z.object({
      kind: z.enum([
        "requirement",
        "clarification",
        "assumption",
        "decision",
        "risk",
        "open_question",
        "contradiction",
      ]),
      content: z.string().min(3).max(240),
      resolved: z.boolean().default(false),
      confidence: z.number().min(0).max(1),
    }),
  ),
  annotations: z.array(
    z.object({
      label: z.string().min(3).max(80),
      impact: z.enum(["positive", "negative", "neutral"]),
      confidence: z.number().min(0).max(1),
      excerpt: z.string().min(1).max(300),
      rationale: z.string().min(3).max(320),
    }),
  ),
  liveSignals: z.object({
    requirementsScore: z.number().min(0).max(100),
    architectureScore: z.number().min(0).max(100),
    tradeoffScore: z.number().min(0).max(100),
    collaborationScore: z.number().min(0).max(100),
  }),
  candidateIntegrity: z.object({
    concernLevel: z.enum(["none", "low", "medium"]),
    summary: z.string().max(400).nullable(),
    patterns: z
      .array(
        z.enum([
          "solicits_full_solution",
          "solicits_hidden_rubric_or_ideal_answer",
          "other_interview_pressure",
        ]),
      )
      .default([]),
  }),
});

export const reportSchema = z.object({
  summary: z.string().min(12).max(1500),
  finalRecommendation: z.enum([
    "strong_hire",
    "hire",
    "lean_hire",
    "no_hire",
    "inconclusive",
  ]),
  scores: z.object({
    requirementDiscovery: z.number().min(0).max(100),
    architecturalQuality: z.number().min(0).max(100),
    scalabilityReasoning: z.number().min(0).max(100),
    tradeoffDepth: z.number().min(0).max(100),
    communicationClarity: z.number().min(0).max(100),
    collaborationQuality: z.number().min(0).max(100),
    stressHandling: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
    assistanceDependency: z.number().min(0).max(100),
  }),
  strengths: z.array(
    z.object({
      title: z.string().min(3).max(120),
      detail: z.string().min(8).max(240),
      evidenceSequence: z.number().int().positive(),
    }),
  ),
  concerns: z.array(
    z.object({
      title: z.string().min(3).max(120),
      detail: z.string().min(8).max(240),
      evidenceSequence: z.number().int().positive(),
    }),
  ),
  notableMoments: z.array(
    z.object({
      title: z.string().min(3).max(120),
      detail: z.string().min(8).max(260),
      channelKind: z.enum(["interviewer", "teammate"]),
      sequence: z.number().int().positive(),
      impact: z.enum(["positive", "negative", "neutral"]),
    }),
  ),
  interviewerGuidance: z.string().min(8).max(500),
  teammateInteraction: z.string().min(8).max(500),
  stressAnalysis: z.string().min(8).max(500),
});
