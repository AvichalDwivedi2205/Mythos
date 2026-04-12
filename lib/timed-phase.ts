import { PHASES, type InterviewPhase } from "./constants";

/**
 * Maps elapsed wall time to the active interview phase by splitting the session
 * budget into equal intervals (one per phase).
 */
export function computeTimedPhaseFromElapsed(
  elapsedMs: number,
  timeBudgetMs: number,
): InterviewPhase {
  if (timeBudgetMs <= 0) {
    return PHASES[0];
  }
  const capped = Math.min(Math.max(0, elapsedMs), timeBudgetMs);
  const n = PHASES.length;
  const idx = Math.min(Math.floor((capped / timeBudgetMs) * n), n - 1);
  return PHASES[idx];
}

export function computeTimedPhaseFromSession(
  startedAt: number,
  timeBudgetMs: number,
  nowMs: number = Date.now(),
): InterviewPhase {
  const elapsed = Math.min(Math.max(0, nowMs - startedAt), timeBudgetMs);
  return computeTimedPhaseFromElapsed(elapsed, timeBudgetMs);
}
