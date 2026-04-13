/**
 * Heuristics for candidate messages that try to extract a full handoff answer,
 * hidden rubric, or other disallowed shortcuts. Used to increment session
 * `fullSolutionSolicitationCount` and to steer the model toward badgeKind "warning".
 */
const solicitationPatterns: RegExp[] = [
  /\b(give|show|provide|tell)\b.{0,24}\b(full|entire|complete|final|perfect)\b.{0,24}\b(solution|answer|design|architecture)\b/i,
  /\b(write|generate|draft)\b.{0,24}\b(my|the)\b.{0,24}\b(final|full|entire)\b.{0,24}\b(solution|answer|design)\b/i,
  /\bsolve\b.{0,18}\b(this|it|question|problem)\b.{0,18}\b(for me)?\b/i,
  /\banswer\b.{0,18}\b(this|it|question|problem)\b.{0,18}\b(for me)?\b/i,
  /\b(hidden|secret)\b.{0,24}\b(requirement|constraint|rubric|answer)\b/i,
  /\b(reveal|leak|show)\b.{0,24}\b(rubric|hidden requirement|hidden constraint|ideal answer)\b/i,
];

export function detectFullSolutionSolicitation(content: string): boolean {
  const normalized = content.trim();
  if (!normalized) {
    return false;
  }

  return solicitationPatterns.some((pattern) => pattern.test(normalized));
}
