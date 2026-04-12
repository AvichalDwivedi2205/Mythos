import { ConvexHttpClient } from "convex/browser";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { api } from "@/convex/_generated/api";

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

const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!deploymentUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required for AI smoke tests.");
}

const client = new ConvexHttpClient(deploymentUrl);

const aiSmokeResultSchema = z.object({
  interviewerContent: z.string().min(20),
  interviewerBadge: z.enum(["brief", "nudge", "stress", "concern", "clarification", "team", "system"]),
  teammateContent: z.string().min(20),
  teammateBadge: z.enum(["brief", "nudge", "stress", "concern", "clarification", "team", "system"]),
  reportRecommendation: z.enum(["strong_hire", "hire", "lean_hire", "no_hire", "inconclusive"]),
  reportSummary: z.string().min(20),
});

async function main() {
  const health = await client.query(api.testing.healthcheck, {});
  if (!health.ok) {
    throw new Error("Convex healthcheck failed.");
  }

  const result = await client.action(api.testingNode.aiSmokeTest, {});
  const parsed = aiSmokeResultSchema.parse(result);

  if (!parsed.interviewerContent.includes("?")) {
    throw new Error("Expected interviewer response to include an interview-style question.");
  }

  if (parsed.teammateContent.toLowerCase().includes("here's the full solution")) {
    throw new Error("Teammate output leaked a full-solution style response.");
  }

  if (!/(hire|inconclusive)/.test(parsed.reportRecommendation)) {
    throw new Error("Unexpected recommendation classification.");
  }

  console.log(
    JSON.stringify(
      {
        health,
        aiSmoke: parsed,
      },
      null,
      2,
    ),
  );
}

void main();
