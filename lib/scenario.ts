import {
  DEFAULT_SCENARIO_ID,
  type InterviewMode,
  PHASES,
  type TeammateSpecialization,
  TEAMMATE_SPECIALIZATIONS,
} from "./constants";

export type ScenarioPack = {
  id: string;
  title: string;
  subtitle: string;
  roleLevel: string;
  prompt: string;
  approvedClarifications: Array<{
    key: string;
    value: string;
  }>;
  hiddenConstraints: string[];
  phaseOrder: typeof PHASES;
  interviewerPersona: string;
  teammateSpecialization: TeammateSpecialization;
  teammateName: string;
  initialInterviewerBrief: string;
  initialTeammateMessage: string;
  reportRubricVersion: string;
  modeCopy: Record<InterviewMode, string>;
};

const defaultTeammate = TEAMMATE_SPECIALIZATIONS[0];

export const scenarioPack: ScenarioPack = {
  id: DEFAULT_SCENARIO_ID,
  title: "Real-Time Chat at Scale",
  subtitle: "System Design · Senior Engineer",
  roleLevel: "Senior Engineer",
  prompt:
    "Design a real-time messaging platform. The system must support 10 million concurrent users globally with messages arriving in under 200ms end-to-end. Clarify requirements before designing, defend tradeoffs clearly, and adapt under pressure.",
  approvedClarifications: [
    { key: "group_size", value: "Both DMs and groups are in scope. Groups support up to 500 members." },
    { key: "ordering", value: "Strong ordering is required within each conversation." },
    { key: "offline_delivery", value: "Offline delivery is required for a 7-day window." },
    { key: "presence", value: "Presence indicators are in scope." },
    { key: "read_receipts", value: "Read receipt delivery can be best-effort. Do not over-engineer it." },
    { key: "multi_region", value: "Global usage is required. Strong ordering is only guaranteed per conversation, not global total ordering." },
  ],
  hiddenConstraints: [
    "Traffic can spike 20x during viral events.",
    "Kafka partition leader failures should not cause permanent message loss.",
    "The candidate should explicitly discuss ordering strategy before finalizing storage.",
  ],
  phaseOrder: PHASES,
  interviewerPersona:
    "You are a concise, skeptical but fair system design interviewer. You push for assumptions, tradeoffs, and concrete justification. You may nudge the candidate back on track, but you must not reveal the full answer.",
  teammateSpecialization: defaultTeammate.value,
  teammateName: defaultTeammate.name,
  initialInterviewerBrief:
    "You're designing a real-time messaging platform for 10 million concurrent users globally with sub-200ms end-to-end delivery.\n\nStart by clarifying scope, ordering guarantees, offline delivery expectations, presence and receipts, and any regional assumptions that materially change the design. Once the scope is clear, walk me through your high-level architecture, critical data flows, storage and ordering strategy, scaling model, and failure handling.\n\nI'll push on tradeoffs and weak assumptions as we go, so keep the discussion concrete and structured.",
  initialTeammateMessage:
    "I’ll pressure-test the infra angle as you go. If you want, start with the connection and fan-out path and I’ll push on scale and failure modes.",
  reportRubricVersion: "v2.1",
  modeCopy: {
    assessment: "Assessment Mode · standardized interview behavior with minimal help.",
    practice: "Practice Mode · directional nudges are allowed when you drift.",
    coaching: "Coaching Mode · richer guidance is allowed and the report will mark the session as assisted.",
  },
};

export function getTeammateMeta(specialization: TeammateSpecialization) {
  return (
    TEAMMATE_SPECIALIZATIONS.find((entry) => entry.value === specialization) ??
    TEAMMATE_SPECIALIZATIONS[0]
  );
}
