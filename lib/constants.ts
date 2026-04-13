export const DEFAULT_SCENARIO_ID = "real-time-chat-at-scale" as const;
export const DEFAULT_TIME_BUDGET_MS = 30 * 60 * 1000;

export const INTERVIEW_KINDS = ["system_design", "consulting_case"] as const;
export type InterviewKind = (typeof INTERVIEW_KINDS)[number];

export const INTERVIEW_KIND_LABELS: Record<InterviewKind, string> = {
  system_design: "System design",
  consulting_case: "Consulting / case study",
};

export const PHASES = [
  "problem_framing",
  "requirements",
  "high_level_design",
  "deep_dive",
  "stress_and_defense",
  "wrap_up",
] as const;

export type InterviewPhase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<InterviewPhase, string> = {
  problem_framing: "Problem Framing",
  requirements: "Requirements",
  high_level_design: "High-Level Design",
  deep_dive: "Deep Dive",
  stress_and_defense: "Stress & Defense",
  wrap_up: "Wrap-Up",
};

export const TEAMMATE_SPECIALIZATIONS = [
  {
    value: "sre_infra",
    label: "SRE · Infra",
    shortLabel: "SRE",
    name: "Priya",
  },
  {
    value: "backend",
    label: "Backend",
    shortLabel: "Backend",
    name: "Marcus",
  },
  {
    value: "data",
    label: "Data",
    shortLabel: "Data",
    name: "Asha",
  },
] as const;

export type TeammateSpecialization = (typeof TEAMMATE_SPECIALIZATIONS)[number]["value"];

export const MODES = ["assessment", "practice", "coaching"] as const;
export type InterviewMode = (typeof MODES)[number];
