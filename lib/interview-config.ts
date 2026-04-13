import type { InterviewKind } from "./constants";

/**
 * Canonical job description for system-design interviews (not candidate-editable in UI).
 * Override at build time with NEXT_PUBLIC_INTERVIEW_JOB_DESCRIPTION.
 */
export const SYSTEM_DESIGN_JOB_DESCRIPTION =
  typeof process !== "undefined" &&
  typeof process.env.NEXT_PUBLIC_INTERVIEW_JOB_DESCRIPTION === "string" &&
  process.env.NEXT_PUBLIC_INTERVIEW_JOB_DESCRIPTION.trim().length > 0
    ? process.env.NEXT_PUBLIC_INTERVIEW_JOB_DESCRIPTION.trim()
    : "Senior backend engineer: distributed systems, real-time messaging, and reliability at scale.";

/**
 * Canonical job description for consulting / case interviews.
 * Override with NEXT_PUBLIC_CONSULTING_JOB_DESCRIPTION.
 */
export const CONSULTING_JOB_DESCRIPTION =
  typeof process !== "undefined" &&
  typeof process.env.NEXT_PUBLIC_CONSULTING_JOB_DESCRIPTION === "string" &&
  process.env.NEXT_PUBLIC_CONSULTING_JOB_DESCRIPTION.trim().length > 0
    ? process.env.NEXT_PUBLIC_CONSULTING_JOB_DESCRIPTION.trim()
    : "Strategy consulting associate: business problem solving, MECE structuring, hypothesis-led analysis, and board-ready recommendations across industries.";

/** @deprecated Use SYSTEM_DESIGN_JOB_DESCRIPTION; kept for older imports. */
export const INTERVIEW_JOB_DESCRIPTION = SYSTEM_DESIGN_JOB_DESCRIPTION;

export function getJobDescriptionForInterviewKind(kind: InterviewKind): string {
  return kind === "consulting_case" ? CONSULTING_JOB_DESCRIPTION : SYSTEM_DESIGN_JOB_DESCRIPTION;
}
