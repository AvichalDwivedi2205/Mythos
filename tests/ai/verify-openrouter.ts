/**
 * Verifies OpenRouter + @ai-sdk/openai + `ai` package work the same way as `convex/lib/llmProvider.ts`.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... bunx tsx tests/ai/verify-openrouter.ts
 *
 * Or rely on .env / .env.local (loaded below). Optional:
 *   OPENROUTER_MODEL=google/gemini-3.1-flash-lite-preview
 *
 * Exit 0: checks passed or skipped (no key).
 * Exit 1: API error or empty/invalid response.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

for (const fileName of [".env", ".env.local"]) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    continue;
  }
  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const delimiterIndex = line.indexOf("=");
    if (delimiterIndex <= 0) {
      continue;
    }
    const key = line.slice(0, delimiterIndex).trim();
    const value = line.slice(delimiterIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const DEFAULT_MODEL = "google/gemini-3.1-flash-lite-preview";

function buildOpenRouterModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return null;
  }
  const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "https://mythos.local",
      "X-Title": process.env.OPENROUTER_APP_TITLE ?? "Mythos",
    },
  });
  const modelId = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  return openrouter.chat(modelId as string);
}

async function main() {
  const model = buildOpenRouterModel();
  if (!model) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: true,
          reason: "OPENROUTER_API_KEY not set; set it to run live OpenRouter verification.",
        },
        null,
        2,
      ),
    );
    return;
  }

  const modelId = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

  // 1) Plain text (same transport as many agent calls)
  const textResult = await generateText({
    model,
    prompt: 'Reply with exactly the word "pong" and nothing else.',
  });

  const trimmed = textResult.text.trim().toLowerCase();
  if (!trimmed.includes("pong")) {
    console.error("Unexpected text response:", textResult.text);
    throw new Error("generateText: expected response to contain 'pong'.");
  }

  // 2) Structured object (matches generateObject in aiRuntime for analysis / reports)
  const objectResult = await generateObject({
    model,
    prompt: 'Return JSON only: {"ok": true, "token": "alpha"}',
    schema: z.object({
      ok: z.boolean(),
      token: z.string(),
    }),
  });

  if (!objectResult.object.ok || objectResult.object.token !== "alpha") {
    console.error("Unexpected object:", objectResult.object);
    throw new Error("generateObject: schema parse or content mismatch.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        skipped: false,
        model: modelId,
        textSample: textResult.text.slice(0, 120),
        textTokens: textResult.usage,
        objectSample: objectResult.object,
        objectTokens: objectResult.usage,
      },
      null,
      2,
    ),
  );
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
