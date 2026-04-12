/**
 * Canonical job description for the interview (not candidate-editable in UI).
 * Override at build time with NEXT_PUBLIC_INTERVIEW_JOB_DESCRIPTION.
 */
export const INTERVIEW_JOB_DESCRIPTION =
  typeof process !== "undefined" &&
  typeof process.env.NEXT_PUBLIC_INTERVIEW_JOB_DESCRIPTION === "string" &&
  process.env.NEXT_PUBLIC_INTERVIEW_JOB_DESCRIPTION.trim().length > 0
    ? process.env.NEXT_PUBLIC_INTERVIEW_JOB_DESCRIPTION.trim()
    : "Senior backend engineer: distributed systems, real-time messaging, and reliability at scale.";
