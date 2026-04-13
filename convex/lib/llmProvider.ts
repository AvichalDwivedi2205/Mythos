import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
/** Convex / server env: `gemini` (default) or `openrouter`. */
export type LlmProviderId = "gemini" | "openrouter";
export type InterviewLlmRole = "interviewer" | "teammate" | "analysis" | "report";

const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite-preview";
const DEFAULT_OPENROUTER_MODEL = "google/gemini-3.1-flash-lite-preview";

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
  // Bracket access so Convex/esbuild does not replace `process.env.LLM_PROVIDER` at bundle time.
  return normalizeProvider(process.env["LLM_PROVIDER"]);
}

/**
 * Next.js `/api/resume-ocr` — follows `LLM_PROVIDER` like Convex.
 *
 * - `gemini` (default): `GEMINI_API_KEY`; optional `GEMINI_OCR_MODEL` or `GEMINI_MODEL` (else flash-lite preview).
 * - `openrouter`: `OPENROUTER_API_KEY`; optional `OPENROUTER_OCR_MODEL` or `OPENROUTER_MODEL` (else `google/gemini-3.1-flash-lite-preview`).
 */
export function getResumeOcrLanguageModel() {
  const provider = getLlmProviderId();

  if (provider === "openrouter") {
    const apiKey = process.env["OPENROUTER_API_KEY"];
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is required for resume OCR when LLM_PROVIDER=openrouter (set in .env.local).",
      );
    }
    const modelId =
      process.env["OPENROUTER_OCR_MODEL"]?.trim() ||
      process.env["OPENROUTER_MODEL"]?.trim() ||
      DEFAULT_OPENROUTER_MODEL;
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      headers: {
        "HTTP-Referer": process.env["OPENROUTER_HTTP_REFERER"] ?? "https://mythos.local",
        "X-Title": process.env["OPENROUTER_APP_TITLE"] ?? "Mythos",
      },
    });
    // Use `.chat()` so requests go to `/v1/chat/completions`. The default callable
    // `openrouter(modelId)` uses OpenAI Responses API (`/v1/responses`), which OpenRouter
    // rejects for many models (e.g. Gemini) with "Invalid Responses API request".
    return openrouter.chat(modelId);
  }

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is required for resume OCR when LLM_PROVIDER is gemini (set in .env.local).",
    );
  }
  const modelId =
    process.env["GEMINI_OCR_MODEL"]?.trim() ||
    process.env["GEMINI_MODEL"]?.trim() ||
    DEFAULT_GEMINI_MODEL;
  return createGoogleGenerativeAI({ apiKey })(modelId);
}

function envWithFallback(
  primaryKey: string,
  fallbackKey: string | null,
): { envKey: string; value: string | undefined } {
  if (fallbackKey) {
    const fallbackValue = process.env[fallbackKey];
    if (fallbackValue) {
      return { envKey: fallbackKey, value: fallbackValue };
    }
  }

  return {
    envKey: primaryKey,
    value: process.env[primaryKey],
  };
}

function getRoleSpecificEnvKeys(
  provider: LlmProviderId,
  role: InterviewLlmRole,
): {
  apiKeyEnvKey: string;
  modelEnvKey: string;
  apiKey: string | undefined;
  modelId: string;
} {
  const useSecondaryKey = role === "teammate";

  if (provider === "openrouter") {
    const apiKeyConfig = envWithFallback(
      "OPENROUTER_API_KEY",
      useSecondaryKey ? "OPENROUTER_API_KEY_1" : null,
    );
    const modelConfig = envWithFallback(
      "OPENROUTER_MODEL",
      useSecondaryKey ? "OPENROUTER_MODEL_1" : null,
    );

    return {
      apiKeyEnvKey: apiKeyConfig.envKey,
      modelEnvKey: modelConfig.envKey,
      apiKey: apiKeyConfig.value,
      modelId: modelConfig.value ?? DEFAULT_OPENROUTER_MODEL,
    };
  }

  const apiKeyConfig = envWithFallback(
    "GEMINI_API_KEY",
    useSecondaryKey ? "GEMINI_API_KEY_1" : null,
  );
  const modelConfig = envWithFallback(
    "GEMINI_MODEL",
    useSecondaryKey ? "GEMINI_MODEL_1" : null,
  );

  return {
    apiKeyEnvKey: apiKeyConfig.envKey,
    modelEnvKey: modelConfig.envKey,
    apiKey: apiKeyConfig.value,
    modelId: modelConfig.value ?? DEFAULT_GEMINI_MODEL,
  };
}

export function describeInterviewLlm(role: InterviewLlmRole = "interviewer"): {
  role: InterviewLlmRole;
  provider: LlmProviderId;
  modelId: string;
  apiKeyEnvKey: string;
  modelEnvKey: string;
} {
  const provider = getLlmProviderId();
  const config = getRoleSpecificEnvKeys(provider, role);

  return {
    role,
    provider,
    modelId: config.modelId,
    apiKeyEnvKey: config.apiKeyEnvKey,
    modelEnvKey: config.modelEnvKey,
  };
}

/**
 * Model routing:
 * - Interviewer, analysis, report: primary key (`GEMINI_API_KEY` / `OPENROUTER_API_KEY`)
 * - Teammate: secondary key when present (`GEMINI_API_KEY_1` / `OPENROUTER_API_KEY_1`),
 *   otherwise falls back to the primary key.
 *
 * Configure via Convex env:
 * - Gemini: `GEMINI_API_KEY`, optional `GEMINI_API_KEY_1`, optional `GEMINI_MODEL`, optional `GEMINI_MODEL_1`
 * - OpenRouter: `LLM_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, optional `OPENROUTER_API_KEY_1`,
 *   optional `OPENROUTER_MODEL`, optional `OPENROUTER_MODEL_1`
 */
export function getInterviewLanguageModel(role: InterviewLlmRole = "interviewer") {
  const provider = getLlmProviderId();
  const config = getRoleSpecificEnvKeys(provider, role);

  if (provider === "openrouter") {
    if (!config.apiKey) {
      throw new Error(
        role === "teammate"
          ? "OPENROUTER_API_KEY_1 or OPENROUTER_API_KEY is required for teammate traffic when LLM_PROVIDER=openrouter."
          : "OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter (set in Convex → Settings → Environment Variables).",
      );
    }
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: config.apiKey,
      headers: {
        "HTTP-Referer": process.env["OPENROUTER_HTTP_REFERER"] ?? "https://mythos.local",
        "X-Title": process.env["OPENROUTER_APP_TITLE"] ?? "Mythos",
      },
    });
    return openrouter.chat(config.modelId);
  }

  if (!config.apiKey) {
    throw new Error(
      role === "teammate"
        ? "GEMINI_API_KEY_1 or GEMINI_API_KEY is required for teammate traffic when LLM_PROVIDER is gemini."
        : "GEMINI_API_KEY is required when LLM_PROVIDER is gemini (default). Set it in Convex → Settings → Environment Variables.",
    );
  }
  const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
  return google(config.modelId);
}
