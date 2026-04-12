"use node";

import { Agent, type AgentComponent, type UsageHandler } from "@convex-dev/agent";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { components, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { getClarificationAnswer, scenarioConfig } from "./lib/scenario";
import { reportSchema, turnAnalysisSchema, visibleAgentResponseSchema } from "./lib/aiSchemas";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model = google("gemini-3.1-flash-lite-preview");
const agentComponent = components.agent as unknown as AgentComponent;

const usageHandler: UsageHandler = async (
  ctx,
  args: {
    threadId: string | undefined;
    usage: {
      inputTokens?: number | undefined;
      outputTokens?: number | undefined;
      totalTokens?: number | undefined;
    };
  },
) => {
  if (!args.threadId) {
    return;
  }

  await ctx.runMutation(internal.sessions.recordUsage, {
    threadId: args.threadId,
    inputTokens: args.usage.inputTokens ?? 0,
    outputTokens: args.usage.outputTokens ?? 0,
    totalTokens: args.usage.totalTokens ?? 0,
  });
};

export const interviewerAgent = new Agent(agentComponent, {
  name: "Interviewer Agent",
  languageModel: model,
  instructions: `${scenarioConfig.interviewerPersona}

You are operating in a standardized system-design interview.
You may:
- ask clarifying questions
- answer approved clarifications
- nudge the candidate back on track
- challenge weak or incomplete reasoning
- inject calibrated stress

You may not:
- reveal the full solution
- leak the hidden rubric
- say whether the candidate is passing or failing
`,
  usageHandler,
  contextOptions: {
    recentMessages: 24,
  },
});

export const teammateAgent = new Agent(agentComponent, {
  name: "Teammate Agent",
  languageModel: model,
  instructions: `You are the candidate's specialist teammate in a system-design interview.
You may:
- challenge weak assumptions
- raise risks and failure modes
- discuss bounded alternatives
- ask the interviewer for clarification if the scope is ambiguous
- sound proactive and human, like a sharp peer in the room rather than a passive observer

You may not:
- solve the interview for the candidate
- reveal hidden requirements
- grade the candidate
`,
  usageHandler,
  contextOptions: {
    recentMessages: 24,
  },
});

type GenerationContext = {
  sessionPublicId: string;
  title: string;
  subtitle: string;
  jobDescription: string;
  resumeSummary: string;
  problemStatement: string;
  sharedContextSeed: string;
  approvedClarifications: Array<{
    key: string;
    value: string;
    keywords: string[];
  }>;
  solutionTemplate: string;
  workingSolution: string;
  mode: string;
  currentPhase: string;
  candidateName: string;
  teammateName: string;
  teammateSpecialization: string;
  threadId: string;
  counterpartThreadId: string;
  candidateMessage: {
    id: string;
    sequence: number;
    content: string;
  };
  sessionState: {
    currentArchitectureSummary: string;
    currentRequirementSummary: string;
    latestRiskSummary: string;
    latestInterviewerChallenge: string;
    latestTeammateConcern: string;
    latestCrossChannelDigest: string;
  };
  recentTranscript: string;
  scratchPad: string;
  signals: {
    requirementsScore: number;
    architectureScore: number;
    tradeoffScore: number;
    collaborationScore: number;
    nudgesGiven: number;
  };
};

export async function generateVisibleResponse(
  ctx: ActionCtx,
  args: {
    channelKind: "interviewer" | "teammate";
    context: GenerationContext;
    onPartialContent?: (content: string) => Promise<void>;
  },
) {
  const prompt = buildVisiblePrompt(args.channelKind, args.context);

  const agent = args.channelKind === "interviewer" ? interviewerAgent : teammateAgent;
  const { thread } = await agent.continueThread(ctx, {
    threadId: args.context.threadId,
    userId: args.context.sessionPublicId,
  });
  const parsed = args.onPartialContent
    ? visibleAgentResponseSchema.parse(
        await streamVisibleResponse(thread, prompt, args.onPartialContent),
      )
    : visibleAgentResponseSchema.parse(
        (
          await thread.generateObject({
            prompt,
            schema: visibleAgentResponseSchema,
          })
        ).object,
      );

  if (
    args.channelKind === "teammate" &&
    parsed.needsClarification &&
    parsed.clarificationQuestion
  ) {
    const answer = getClarificationAnswer(
      parsed.clarificationQuestion,
      args.context.approvedClarifications,
    );
    if (answer) {
      return {
        ...parsed,
        badgeKind: "clarification" as const,
        eventSummary: "Clarification relayed from interviewer",
        content: `I checked with the interviewer: ${answer}\n\n${parsed.content}`,
      };
    }
  }

  return parsed;
}

async function streamVisibleResponse(
  thread: Awaited<ReturnType<typeof interviewerAgent.continueThread>>["thread"],
  prompt: string,
  onPartialContent: (content: string) => Promise<void>,
) {
  const result = await thread.streamObject({
    prompt,
    schema: visibleAgentResponseSchema,
  });
  let lastContent = "";

  for await (const partial of result.partialObjectStream) {
    const nextContent = getPartialContent(partial);
    if (!nextContent || nextContent === lastContent) {
      continue;
    }

    lastContent = nextContent;
    await onPartialContent(nextContent);
  }

  return await result.object;
}

function getPartialContent(partial: unknown) {
  if (
    typeof partial === "object" &&
    partial !== null &&
    "content" in partial &&
    typeof partial.content === "string"
  ) {
    return partial.content;
  }

  return "";
}

export async function generateTurnAnalysis(
  context: GenerationContext,
  args: {
    responseContent: string;
    responseBadgeKind: string;
  },
) {
  const prompt = `You are the hidden evaluation layer for an AI-driven system design interview.
Return a compact, citation-friendly turn analysis for the candidate-visible interaction below.

Scenario: ${context.title}
Problem statement:
${context.problemStatement}

Candidate background summary:
${context.resumeSummary || "Not provided."}

Job description signal:
${context.jobDescription || "Not provided."}

Mode: ${context.mode}
Phase: ${context.currentPhase}
Candidate message (sequence ${context.candidateMessage.sequence}):
${context.candidateMessage.content}

Visible agent response:
${args.responseContent}

Current requirement summary:
${context.sessionState.currentRequirementSummary || "None yet."}

Current architecture summary:
${context.sessionState.currentArchitectureSummary || "None yet."}

Latest cross-channel digest:
${context.sessionState.latestCrossChannelDigest || "None yet."}

Working solution snapshot:
${context.workingSolution || "No submitted outline yet."}

Live signal values before this turn:
- Requirements: ${context.signals.requirementsScore}
- Architecture: ${context.signals.architectureScore}
- Tradeoffs: ${context.signals.tradeoffScore}
- Collaboration: ${context.signals.collaborationScore}
- Nudges: ${context.signals.nudgesGiven}

Produce:
- concise updated summaries
- extracted structured facts
- annotations with short excerpts and rationale
- updated live signals

Do not mention hidden chain-of-thought.`;

  const result = await generateObject({
    model,
    prompt,
    schema: turnAnalysisSchema,
  });

  return turnAnalysisSchema.parse(result.object);
}

export async function generateFinalReport(args: {
  sessionTitle: string;
  subtitle: string;
  candidateName: string;
  mode: string;
  transcriptText: string;
  annotationsText: string;
  countersText: string;
  currentStateText: string;
  finalSolutionText: string;
}) {
  const prompt = `You are generating the final hiring-style report for a standardized AI-led system design interview.

Session title: ${args.sessionTitle}
Subtitle: ${args.subtitle}
Candidate: ${args.candidateName}
Mode: ${args.mode}

Current state summary:
${args.currentStateText}

Final solution submission:
${args.finalSolutionText || "No final solution was explicitly submitted."}

Counters:
${args.countersText}

Annotations:
${args.annotationsText}

Transcript:
${args.transcriptText}

Write a concise, evidence-backed report. Every strength, concern, and notable moment must tie to a concrete sequence number from the transcript.`;

  const result = await generateObject({
    model,
    prompt,
    schema: reportSchema,
  });

  return reportSchema.parse(result.object);
}

function buildVisiblePrompt(
  channelKind: "interviewer" | "teammate",
  context: GenerationContext,
) {
  const clarificationList = context.approvedClarifications
    .map((clarification) => `- ${clarification.value}`)
    .join("\n");

  if (channelKind === "interviewer") {
    return `You are speaking in the candidate-visible interviewer channel.

Scenario: ${context.title}
Subtitle: ${context.subtitle}
Problem statement:
${context.problemStatement}

Candidate background summary:
${context.resumeSummary || "Not provided."}

Job description signal:
${context.jobDescription || "Not provided."}

Shared pool context:
${context.sharedContextSeed || "No shared seed yet."}

Mode: ${context.mode}
Current phase: ${context.currentPhase}

Candidate latest message (sequence ${context.candidateMessage.sequence}):
${context.candidateMessage.content}

Current requirement summary:
${context.sessionState.currentRequirementSummary || "None yet."}

Current architecture summary:
${context.sessionState.currentArchitectureSummary || "None yet."}

Recent transcript context:
${context.recentTranscript || "No earlier turns yet."}

Scratch pad notes:
${context.scratchPad || "No private notes yet."}

Latest known risk:
${context.sessionState.latestRiskSummary || "None yet."}

Latest teammate concern:
${context.sessionState.latestTeammateConcern || "None yet."}

Working solution template:
${context.solutionTemplate || "No template available."}

Current candidate solution workspace:
${context.workingSolution || "No draft yet."}

Approved clarifications you may reveal:
${clarificationList}

Output rules:
- use "nudge" only when redirecting the candidate back toward an important missing piece
- use "stress" only when deliberately increasing pressure
- use "brief" only for initial framing or a phase reset
- otherwise prefer "team" or "clarification" style badges sparingly
- keep content concise, sharp, and interview-like
- ask a question whenever possible
- during deep dive or wrap-up, occasionally force the candidate to consolidate the final solution
- never give the full solution`;
  }

  return `You are speaking in the candidate-visible teammate channel.

You are ${context.teammateName}, specialization ${context.teammateSpecialization}.
Scenario: ${context.title}
Problem statement:
${context.problemStatement}

Candidate background summary:
${context.resumeSummary || "Not provided."}

Job description signal:
${context.jobDescription || "Not provided."}

Shared pool context:
${context.sharedContextSeed || "No shared seed yet."}

Mode: ${context.mode}
Current phase: ${context.currentPhase}

Candidate latest message (sequence ${context.candidateMessage.sequence}):
${context.candidateMessage.content}

Current requirement summary:
${context.sessionState.currentRequirementSummary || "None yet."}

Current architecture summary:
${context.sessionState.currentArchitectureSummary || "None yet."}

Recent transcript context:
${context.recentTranscript || "No earlier turns yet."}

Scratch pad notes:
${context.scratchPad || "No private notes yet."}

Latest known risk:
${context.sessionState.latestRiskSummary || "None yet."}

Latest interviewer challenge:
${context.sessionState.latestInterviewerChallenge || "None yet."}

Working solution template:
${context.solutionTemplate || "No template available."}

Current candidate solution workspace:
${context.workingSolution || "No draft yet."}

If you genuinely need clarification from the interviewer on scope or constraints, set needsClarification=true and ask one short clarification question.
Otherwise keep needsClarification=false.

Your job is to pressure-test the design, raise risks, stay proactive, and collaborate without solving the interview for the candidate.`;
}
