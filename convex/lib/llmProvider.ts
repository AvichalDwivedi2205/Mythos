import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
/** Convex / server env: `gemini` (default) or `openrouter`. */
export type LlmProviderId = "gemini" | "openrouter";

const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite-preview";
const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash-lite";

function normalizeProvider(raw: string | undefined): LlmProviderId {
  const v = (raw ?? "gemini").trim().toLowerCase();
  if (v === "openrouter" || v === "router") {
    return "openrouter";
  }
  if (v === "gemini" || v === "google" || v === "") {
    return "gemini";
  }
  throw new Error(
    `Invalid LLM_PROVIDER "${raw ?? ""}". Use "gemini" (default) or "openrouter".`,
  );
}

export function getLlmProviderId(): LlmProviderId {
  return normalizeProvider(process.env.LLM_PROVIDER);
}

/**
 * Single language model for interviewer agent, teammate agent, turn analysis, and reports.
 * Configure via Convex env:
 * - Default: `GEMINI_API_KEY` + optional `GEMINI_MODEL`
 * - OpenRouter: `LLM_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, optional `OPENROUTER_MODEL`
 */
export function getInterviewLanguageModel() {
  const provider = getLlmProviderId();

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter (set in Convex → Settings → Environment Variables).",
      );
    }
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      headers: {
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "https://mythos.local",
        "X-Title": process.env.OPENROUTER_APP_TITLE ?? "Mythos",
      },
    });
    const modelId = (process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL) as string;
    return openrouter(modelId);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is required when LLM_PROVIDER is gemini (default). Set it in Convex → Settings → Environment Variables.",
    );
  }
  const google = createGoogleGenerativeAI({ apiKey });
  const modelId = (process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL) as string;
  return google(modelId);
}

export function describeInterviewLlm(): {
  provider: LlmProviderId;
  modelId: string;
} {
  const provider = getLlmProviderId();
  if (provider === "openrouter") {
    return {
      provider,
      modelId: process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL,
    };
  }
  return {
    provider,
    modelId: process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
  };
}
