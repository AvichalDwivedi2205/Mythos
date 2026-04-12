export type IntegrityWarning = {
  code:
    | "full_solution_request"
    | "hidden_rubric_request"
    | "direct_answer_request";
  title: string;
  detail: string;
  severity: "warning" | "critical";
  blocked: boolean;
};

const suspiciousPatterns: Array<{
  code: IntegrityWarning["code"];
  title: string;
  detail: string;
  severity: IntegrityWarning["severity"];
  blocked: boolean;
  matches: RegExp[];
}> = [
  {
    code: "full_solution_request",
    title: "Full-solution request blocked",
    detail:
      "The room can coach, challenge, and clarify, but it should not hand over the complete answer. Ask for feedback on a specific part instead.",
    severity: "critical",
    blocked: true,
    matches: [
      /\b(give|show|provide|tell)\b.{0,24}\b(full|entire|complete|final|perfect)\b.{0,24}\b(solution|answer|design|architecture)\b/i,
      /\b(write|generate|draft)\b.{0,24}\b(my|the)\b.{0,24}\b(final|full|entire)\b.{0,24}\b(solution|answer|design)\b/i,
    ],
  },
  {
    code: "direct_answer_request",
    title: "Direct answer request blocked",
    detail:
      "Asking the system to solve the prompt outright breaks the interview contract. Reframe the message around tradeoffs, assumptions, or one design slice.",
    severity: "warning",
    blocked: true,
    matches: [
      /\bsolve\b.{0,18}\b(this|it|question|problem)\b.{0,18}\b(for me)?\b/i,
      /\banswer\b.{0,18}\b(this|it|question|problem)\b.{0,18}\b(for me)?\b/i,
    ],
  },
  {
    code: "hidden_rubric_request",
    title: "Rubric or hidden-info request blocked",
    detail:
      "Hidden requirements, rubric details, and ideal answers stay private so the interview remains realistic.",
    severity: "critical",
    blocked: true,
    matches: [
      /\b(hidden|secret)\b.{0,24}\b(requirement|constraint|rubric|answer)\b/i,
      /\b(reveal|leak|show)\b.{0,24}\b(rubric|hidden requirement|hidden constraint|ideal answer)\b/i,
    ],
  },
];

export function detectIntegrityWarning(content: string): IntegrityWarning | null {
  const normalized = content.trim();
  if (!normalized) {
    return null;
  }

  for (const rule of suspiciousPatterns) {
    if (rule.matches.some((pattern) => pattern.test(normalized))) {
      return {
        code: rule.code,
        title: rule.title,
        detail: rule.detail,
        severity: rule.severity,
        blocked: rule.blocked,
      };
    }
  }

  return null;
}
