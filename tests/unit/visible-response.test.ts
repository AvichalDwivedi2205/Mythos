import { describe, expect, it } from "vitest";
import {
  buildFallbackVisibleResponse,
  repairVisibleAgentResponse,
} from "@/convex/lib/visibleResponse";

describe("repairVisibleAgentResponse", () => {
  it("repairs invalid interviewer badge values without dropping the reply", () => {
    const repaired = repairVisibleAgentResponse("interviewer", {
      mode: "challenge",
      badgeKind: "challenge",
      content:
        "We should verify whether the proposed partitioning still holds the p95 target during replay spikes.",
      eventSummary: "",
      shouldAdvancePhase: true,
      nextPhase: "not_a_real_phase",
    });

    expect(repaired.mode).toBe("challenge");
    expect(repaired.badgeKind).toBe("team");
    expect(repaired.content).toContain("partitioning");
    expect(repaired.eventSummary).toBe("Design tradeoff follow-up");
    expect(repaired.shouldAdvancePhase).toBe(false);
    expect(repaired.nextPhase).toBeNull();
  });

  it("salvages streamed partial teammate content when the final object is malformed", () => {
    const repaired = repairVisibleAgentResponse(
      "teammate",
      {
        mode: "challenge",
        badgeKind: "challenge",
        content: "short",
        eventSummary: "x",
      },
      {
        partialContent:
          "Hashing by tenant and time bucket is safer to start, but replay isolation is still the first failure mode I would pressure-test",
      },
    );

    expect(repaired.badgeKind).toBe("concern");
    expect(repaired.content).toContain("Hashing by tenant and time bucket");
    expect(repaired.eventSummary).toBe("Pressure-testing the current plan");
  });

  it("produces a deterministic fallback instead of an empty response", () => {
    const fallback = buildFallbackVisibleResponse("interviewer");

    expect(fallback.mode).toBe("probe");
    expect(fallback.badgeKind).toBe("team");
    expect(fallback.content.length).toBeGreaterThanOrEqual(8);
    expect(fallback.eventSummary).toBe("Design tradeoff follow-up");
  });
});
