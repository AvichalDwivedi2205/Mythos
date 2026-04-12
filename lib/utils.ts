import { PHASE_LABELS, type InterviewPhase } from "./constants";

export function formatPhaseLabel(phase: InterviewPhase) {
  return PHASE_LABELS[phase];
}

export function formatTimer(msRemaining: number) {
  const safe = Math.max(0, msRemaining);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function createPublicId(prefix: string) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let suffix = "";

  for (let index = 0; index < 8; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `${prefix}-${suffix}`;
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
