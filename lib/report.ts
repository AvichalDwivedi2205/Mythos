export type ParsedReport = {
  summary: string;
  finalRecommendation: "strong_hire" | "hire" | "lean_hire" | "no_hire" | "inconclusive";
  scores: Record<string, number>;
  strengths: Array<{ title: string; detail: string; evidenceSequence: number }>;
  concerns: Array<{ title: string; detail: string; evidenceSequence: number }>;
  notableMoments: Array<{
    title: string;
    detail: string;
    channelKind: "interviewer" | "teammate";
    sequence: number;
    impact: "positive" | "negative" | "neutral";
  }>;
  interviewerGuidance: string;
  teammateInteraction: string;
  stressAnalysis: string;
};

export function parseReportJson(reportJson: string | null) {
  if (!reportJson) {
    return null;
  }

  return JSON.parse(reportJson) as ParsedReport;
}

export function formatRecommendation(
  recommendation: ParsedReport["finalRecommendation"] | null | undefined,
) {
  if (!recommendation) {
    return "Pending";
  }

  return recommendation.replace(/_/g, " ");
}

export function formatScoreLabel(rawKey: string) {
  return rawKey.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

export function renderScoreEntries(scores: ParsedReport["scores"]) {
  return Object.entries(scores).sort((left, right) => right[1] - left[1]);
}
