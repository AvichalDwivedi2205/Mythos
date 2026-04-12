import type { z } from "zod";
import {
  interviewPhaseValues,
  visibleAgentResponseDraftSchema,
  visibleAgentResponseSchema,
  visibleResponseBadgeKinds,
  visibleResponseModes,
} from "./aiSchemas";

export type VisibleChannelKind = "interviewer" | "teammate";
export type VisibleAgentResponse = z.infer<typeof visibleAgentResponseSchema>;
export type VisibleAgentResponseDraft = z.infer<typeof visibleAgentResponseDraftSchema>;

const validModes = new Set<string>(visibleResponseModes);
const validBadgeKinds = new Set<string>(visibleResponseBadgeKinds);
const validPhases = new Set<string>(interviewPhaseValues);

const defaultModeByChannel: Record<VisibleChannelKind, VisibleAgentResponse["mode"]> = {
  interviewer: "probe",
  teammate: "collaborate",
};

const deterministicFallbackContent: Record<VisibleChannelKind, string> = {
  interviewer:
    "Let's keep this concrete: which single design decision are you making first, and how does it change your throughput or latency target?",
  teammate:
    "I want to pressure-test one thing before we move on: which part of this design is most likely to fail first at the target scale, and how would you contain it?",
};

function normalizeBlockText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeInlineText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function clip(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength).trim();
}

function ensureTerminalPunctuation(text: string) {
  if (!text) {
    return text;
  }

  if (/[.!?]$/.test(text)) {
    return text;
  }

  return `${text}...`;
}

function coerceMode(
  channelKind: VisibleChannelKind,
  value: unknown,
): VisibleAgentResponse["mode"] {
  const normalized = normalizeInlineText(value);
  if (validModes.has(normalized)) {
    return normalized as VisibleAgentResponse["mode"];
  }

  return defaultModeByChannel[channelKind];
}

function coercePhase(value: unknown): VisibleAgentResponse["nextPhase"] {
  const normalized = normalizeInlineText(value);
  if (validPhases.has(normalized)) {
    return normalized as VisibleAgentResponse["nextPhase"];
  }

  return null;
}

function deriveBadgeKind(
  channelKind: VisibleChannelKind,
  mode: VisibleAgentResponse["mode"],
  rawBadgeKind: unknown,
  needsClarification: boolean,
): VisibleAgentResponse["badgeKind"] {
  const normalized = normalizeInlineText(rawBadgeKind);
  if (validBadgeKinds.has(normalized)) {
    return normalized as VisibleAgentResponse["badgeKind"];
  }

  if (needsClarification) {
    return "clarification";
  }

  if (channelKind === "interviewer") {
    if (mode === "brief") {
      return "brief";
    }
    if (mode === "nudge") {
      return "nudge";
    }
    if (mode === "stress") {
      return "stress";
    }
    return "team";
  }

  if (mode === "stress" || mode === "nudge" || mode === "challenge") {
    return "concern";
  }

  return "team";
}

function deriveEventSummary(
  channelKind: VisibleChannelKind,
  badgeKind: VisibleAgentResponse["badgeKind"],
  mode: VisibleAgentResponse["mode"],
) {
  if (channelKind === "interviewer") {
    if (badgeKind === "stress") {
      return "Stress-testing the current design";
    }
    if (badgeKind === "nudge") {
      return "Redirecting to a missing design gap";
    }
    if (mode === "brief") {
      return "Interviewer follow-up";
    }
    return "Design tradeoff follow-up";
  }

  if (badgeKind === "clarification") {
    return "Clarification relayed from interviewer";
  }
  if (badgeKind === "concern") {
    return "Pressure-testing the current plan";
  }
  return "Teammate follow-up";
}

function pickContent(
  channelKind: VisibleChannelKind,
  draftContent: unknown,
  partialContent?: string | null,
) {
  const normalizedDraft = clip(normalizeBlockText(draftContent), 2000);
  if (normalizedDraft.length >= 8) {
    return normalizedDraft;
  }

  const normalizedPartial = clip(normalizeBlockText(partialContent), 2000);
  if (normalizedPartial.length >= 24) {
    return ensureTerminalPunctuation(normalizedPartial);
  }

  return deterministicFallbackContent[channelKind];
}

export function buildVisibleResponseOutputContract(channelKind: VisibleChannelKind) {
  const defaultMode = defaultModeByChannel[channelKind];
  const defaultBadge = channelKind === "interviewer" ? "team" : "team";

  return `Structured output contract:
- mode: exactly one of ${visibleResponseModes.map((value) => `"${value}"`).join(", ")}
- badgeKind: exactly one of ${visibleResponseBadgeKinds.map((value) => `"${value}"`).join(", ")}
- content: a concise candidate-visible reply with at least one complete sentence
- eventSummary: a short label under 160 characters
- shouldAdvancePhase: boolean
- nextPhase: one of ${interviewPhaseValues.map((value) => `"${value}"`).join(", ")} or null
- needsClarification: boolean
- clarificationQuestion: string or null
- if unsure, default to mode="${defaultMode}" and badgeKind="${defaultBadge}"
- never use "challenge" as badgeKind; "challenge" is only valid for mode`;
}

export function repairVisibleAgentResponse(
  channelKind: VisibleChannelKind,
  draft: VisibleAgentResponseDraft | null | undefined,
  options?: {
    partialContent?: string | null;
  },
): VisibleAgentResponse {
  const mode = coerceMode(channelKind, draft?.mode);
  const rawClarificationQuestion = clip(normalizeInlineText(draft?.clarificationQuestion), 240);
  const canClarify =
    channelKind === "teammate" &&
    draft?.needsClarification === true &&
    rawClarificationQuestion.length >= 3;
  const badgeKind = deriveBadgeKind(channelKind, mode, draft?.badgeKind, canClarify);
  const content = pickContent(channelKind, draft?.content, options?.partialContent);
  const eventSummaryCandidate = clip(normalizeInlineText(draft?.eventSummary), 160);
  const nextPhase = draft?.shouldAdvancePhase === true ? coercePhase(draft?.nextPhase) : null;
  const shouldAdvancePhase = nextPhase !== null;

  return visibleAgentResponseSchema.parse({
    mode,
    badgeKind,
    content,
    eventSummary:
      eventSummaryCandidate.length >= 3
        ? eventSummaryCandidate
        : deriveEventSummary(channelKind, badgeKind, mode),
    shouldAdvancePhase,
    nextPhase,
    needsClarification: canClarify,
    clarificationQuestion: canClarify ? rawClarificationQuestion : null,
  });
}

export function buildFallbackVisibleResponse(
  channelKind: VisibleChannelKind,
  partialContent?: string | null,
): VisibleAgentResponse {
  return repairVisibleAgentResponse(channelKind, null, { partialContent });
}
