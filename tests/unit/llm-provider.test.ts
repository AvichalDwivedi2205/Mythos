import { afterEach, describe, expect, it } from "vitest";
import { describeInterviewLlm } from "@/convex/lib/llmProvider";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("describeInterviewLlm", () => {
  it("routes teammate Gemini traffic to the secondary key when present", () => {
    process.env.LLM_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "primary";
    process.env.GEMINI_API_KEY_1 = "secondary";
    process.env.GEMINI_MODEL = "gemini-primary";
    process.env.GEMINI_MODEL_1 = "gemini-secondary";

    const interviewer = describeInterviewLlm("interviewer");
    const teammate = describeInterviewLlm("teammate");

    expect(interviewer.apiKeyEnvKey).toBe("GEMINI_API_KEY");
    expect(interviewer.modelId).toBe("gemini-primary");
    expect(teammate.apiKeyEnvKey).toBe("GEMINI_API_KEY_1");
    expect(teammate.modelId).toBe("gemini-secondary");
  });

  it("falls back to the primary OpenRouter key when teammate secondary key is absent", () => {
    process.env.LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "primary-router";
    process.env.OPENROUTER_MODEL = "router-primary";
    delete process.env.OPENROUTER_API_KEY_1;
    delete process.env.OPENROUTER_MODEL_1;

    const teammate = describeInterviewLlm("teammate");

    expect(teammate.provider).toBe("openrouter");
    expect(teammate.apiKeyEnvKey).toBe("OPENROUTER_API_KEY");
    expect(teammate.modelId).toBe("router-primary");
  });
});
