import { describe, expect, it } from "vitest";
import { formatRecommendation, formatScoreLabel, parseReportJson, renderScoreEntries } from "@/lib/report";

describe("report helpers", () => {
  it("parses stored report json", () => {
    const parsed = parseReportJson(
      JSON.stringify({
        summary: "Candidate handled the design with clear tradeoff articulation.",
        finalRecommendation: "hire",
        scores: {
          requirementDiscovery: 82,
          stressHandling: 71,
        },
        strengths: [],
        concerns: [],
        notableMoments: [],
        interviewerGuidance: "Targeted but fair.",
        teammateInteraction: "Healthy collaboration.",
        stressAnalysis: "Recovered after a scaling push.",
      }),
    );

    expect(parsed?.finalRecommendation).toBe("hire");
    expect(parsed?.scores.requirementDiscovery).toBe(82);
  });

  it("formats recommendation and labels for display", () => {
    expect(formatRecommendation("lean_hire")).toBe("lean hire");
    expect(formatScoreLabel("requirementDiscovery")).toBe("Requirement Discovery");
  });

  it("sorts score entries from highest to lowest", () => {
    const entries = renderScoreEntries({
      communicationClarity: 64,
      consistency: 89,
      tradeoffDepth: 77,
    });

    expect(entries[0]).toEqual(["consistency", 89]);
    expect(entries[2]).toEqual(["communicationClarity", 64]);
  });
});
