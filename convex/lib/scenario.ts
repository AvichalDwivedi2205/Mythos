import type { InterviewMode, InterviewPhase, TeammateSpecialization } from "../../lib/constants";

export const scenarioConfig = {
  id: "real-time-chat-at-scale",
  title: "Real-Time Chat at Scale",
  subtitle: "System Design · Senior Engineer",
  roleLevel: "Senior Engineer",
  rubricVersion: "v2.1",
  interviewerPersona:
    "You are a concise, skeptical but fair system design interviewer. You push for assumptions, tradeoffs, and concrete justification. You may nudge the candidate back on track, but you must not reveal the full answer.",
  prompt:
    "Design a global real-time messaging platform supporting 10 million concurrent users with sub-200ms end-to-end delivery. Clarify assumptions before locking in the architecture, defend tradeoffs clearly, and adapt under stress.",
  initialInterviewerBrief:
    "You're designing a real-time messaging platform for 10 million concurrent users globally with sub-200ms end-to-end delivery.\n\nStart by clarifying scope, ordering guarantees, offline delivery expectations, presence and receipts, and any regional assumptions that materially change the design. Once the scope is clear, walk me through your high-level architecture, critical data flows, storage and ordering strategy, scaling model, and failure handling.\n\nI'll push on tradeoffs and weak assumptions as we go, so keep the discussion concrete and structured.",
  initialTeammateMessage:
    "I’m coming at this from the infra side. If you want, start with connection routing and fan-out and I’ll pressure-test scale and failure modes.",
  phaseOrder: [
    "problem_framing",
    "requirements",
    "high_level_design",
    "deep_dive",
    "stress_and_defense",
    "wrap_up",
  ] as const satisfies readonly InterviewPhase[],
  approvedClarifications: [
    {
      key: "groups",
      keywords: ["group", "groups", "member", "members"],
      value: "Both DMs and groups are in scope, with groups up to 500 members.",
    },
    {
      key: "ordering",
      keywords: ["ordering", "order", "sequence"],
      value: "Strong ordering is required within each conversation.",
    },
    {
      key: "offline",
      keywords: ["offline", "delivery", "retention", "store and forward"],
      value: "Offline delivery is required for a 7-day window.",
    },
    {
      key: "presence",
      keywords: ["presence", "online", "last seen"],
      value: "Presence indicators are in scope.",
    },
    {
      key: "read_receipts",
      keywords: ["receipt", "receipts", "read receipt", "seen"],
      value: "Read receipt delivery can be best-effort. Do not over-engineer it.",
    },
    {
      key: "regions",
      keywords: ["multi-region", "multi region", "global", "cross-region", "cross region"],
      value:
        "Global usage is required. Strong ordering is required within each conversation, but not a single global total order.",
    },
  ],
  defaultNotes: [
    {
      label: "Requirement" as const,
      color: "#f7ec6e",
      content: "Strong ordering within each conversation",
      sortOrder: 0,
    },
    {
      label: "Constraint" as const,
      color: "#fde68a",
      content: "Offline delivery -> 7-day window",
      sortOrder: 1,
    },
    {
      label: "Design note" as const,
      color: "#bbf7d0",
      content: "Groups <= 500 members · Presence = yes · Receipts = best-effort",
      sortOrder: 2,
    },
    {
      label: "Open question" as const,
      color: "#bfdbfe",
      content: "Message ID scheme for ordering guarantees",
      sortOrder: 3,
    },
  ],
  teammateDefaults: {
    sre_infra: {
      name: "Priya",
      label: "SRE · Infra",
      shortLabel: "SRE",
    },
    backend: {
      name: "Marcus",
      label: "Backend",
      shortLabel: "Backend",
    },
    data: {
      name: "Asha",
      label: "Data",
      shortLabel: "Data",
    },
  } as const satisfies Record<
    TeammateSpecialization,
    { name: string; label: string; shortLabel: string }
  >,
  modeDescriptions: {
    assessment: "Assessment Mode · minimal help, strongest standardization.",
    practice: "Practice Mode · directional nudges are allowed when you drift.",
    coaching: "Coaching Mode · richer guidance is allowed and the report is marked assisted.",
  } as const satisfies Record<InterviewMode, string>,
};

export function getClarificationAnswer(
  question: string,
  clarifications = scenarioConfig.approvedClarifications,
) {
  const normalized = question.toLowerCase();

  for (const clarification of clarifications) {
    if (clarification.keywords.some((keyword) => normalized.includes(keyword))) {
      return clarification.value;
    }
  }

  return null;
}
