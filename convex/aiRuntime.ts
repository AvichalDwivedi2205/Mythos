"use node";

import { Agent, type AgentComponent, type UsageHandler } from "@convex-dev/agent";
import { generateObject } from "ai";
import { components, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { getInterviewLanguageModel } from "./lib/llmProvider";
import { getClarificationAnswer } from "./lib/scenario";
import {
  reportSchema,
  turnAnalysisSchema,
  visibleAgentResponseGenerationSchema,
} from "./lib/aiSchemas";
import {
  buildFallbackVisibleResponse,
  buildVisibleResponseOutputContract,
  repairVisibleAgentResponse,
} from "./lib/visibleResponse";

const interviewerModel = getInterviewLanguageModel("interviewer");
const teammateModel = getInterviewLanguageModel("teammate");
const analysisModel = getInterviewLanguageModel("analysis");
const reportModel = getInterviewLanguageModel("report");
const agentComponent = components.agent as unknown as AgentComponent;
const MAX_VISIBLE_RESPONSE_ATTEMPTS = 2;
/** Gemini often stops early on all-optional object schemas; keep headroom for the required reply body. */
const VISIBLE_RESPONSE_MAX_OUTPUT_TOKENS = 1536;

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

const INTERVIEWER_AGENT_INSTRUCTIONS = `You are a concise, skeptical but fair interviewer for practice sessions that may be either system design or consulting / case study.
You push for explicit assumptions, justified tradeoffs, and concrete reasoning. You may nudge the candidate back on track,
but you must not reveal the full answer or hidden rubric.

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

Each turn prompt states the interview modality and scenario framing (title, problem statement, job signal, shared pool context).

System-design modality: the problem statement includes quantified engineering targets (throughput, latency, retention, cost, SLOs). Treat those as canonical unless you are explicitly negotiating a named tradeoff.

Consulting / case modality: follow case-interview discipline—clarify before concluding, keep structures MECE, stay hypothesis-led, sanity-check math, and treat exhibit numbers in the brief as authoritative unless exploring an explicit scenario twist. Do not let the candidate jump to a single recommendation without testing alternatives.`;

export const interviewerAgent = new Agent(agentComponent, {
  name: "Interviewer Agent",
  languageModel: interviewerModel,
  instructions: `${INTERVIEWER_AGENT_INSTRUCTIONS}

The product has two candidate-facing chat tabs: this interviewer channel and a separate teammate channel for informal peer-style collaboration. You do not need to repeat that; focus here on structured probing.`,
  usageHandler,
  contextOptions: {
    recentMessages: 24,
  },
});

export const teammateAgent = new Agent(agentComponent, {
  name: "Teammate Agent",
  languageModel: teammateModel,
  instructions: `You are the candidate's specialist teammate (teammate tab only; the interviewer tab is separate). Sessions may be system design or consulting case study—each turn prompt states the modality.
The candidate is encouraged to bounce ideas, tradeoffs, and half-formed sketches with you. Short brainstorms and "what if" questions are normal collaboration, not cheating.

You may:
- challenge weak assumptions
- raise risks and failure modes
- discuss bounded alternatives and brainstorm next steps with the candidate
- ask the interviewer for clarification if the scope is ambiguous
- sound proactive and human, like a sharp peer in the room rather than a passive observer

You may not:
- dump a complete end-to-end answer that replaces the candidate's own work
- reveal hidden requirements
- grade the candidate

Always reply with substantive visible text in every turn (never an empty reply). Keep responses concise.

System design: use quantified targets in the brief when pressure-testing feasibility and failure modes.

Consulting cases: pressure-test MECE structure, hypotheses, math, and whether the story ties back to the client's goal; use exhibit numbers as anchors.`,
  usageHandler,
  contextOptions: {
    recentMessages: 24,
  },
});

type GenerationContext = {
  sessionPublicId: string;
  interviewKind: "system_design" | "consulting_case";
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

  let lastPartialContent = "";
  for (let attempt = 1; attempt <= MAX_VISIBLE_RESPONSE_ATTEMPTS; attempt += 1) {
    try {
      const rawResponse = args.onPartialContent
        ? await streamVisibleResponse(thread, prompt, async (content) => {
            lastPartialContent = content;
            await args.onPartialContent?.(content);
          })
        : (
            await thread.generateObject({
              prompt,
              schema: visibleAgentResponseGenerationSchema,
              maxOutputTokens: VISIBLE_RESPONSE_MAX_OUTPUT_TOKENS,
            })
          ).object;
      const parsed = repairVisibleAgentResponse(args.channelKind, rawResponse, {
        partialContent: lastPartialContent,
      });

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
    } catch (error) {
      const canSalvagePartial = lastPartialContent.trim().length >= 24;
      const isFinalAttempt = attempt === MAX_VISIBLE_RESPONSE_ATTEMPTS;

      console.error(
        `[generateVisibleResponse] Attempt ${attempt} failed for ${args.channelKind}.`,
        error,
      );

      if (canSalvagePartial || isFinalAttempt) {
        return buildFallbackVisibleResponse(args.channelKind, lastPartialContent);
      }
    }
  }

  return buildFallbackVisibleResponse(args.channelKind, lastPartialContent);
}

async function streamVisibleResponse(
  thread: Awaited<ReturnType<typeof interviewerAgent.continueThread>>["thread"],
  prompt: string,
  onPartialContent: (content: string) => Promise<void>,
) {
  const result = await thread.streamObject({
    prompt,
    schema: visibleAgentResponseGenerationSchema,
    maxOutputTokens: VISIBLE_RESPONSE_MAX_OUTPUT_TOKENS,
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
  const modalityLine =
    context.interviewKind === "consulting_case"
      ? `Interview modality: consulting / case study. Weight MECE structure, hypothesis discipline, quantitative checks, and synthesis quality. Treat "architecture" summaries in session state as the evolving case structure / driver logic if they read that way.`
      : `Interview modality: system design. Weight requirements clarity, architecture depth, and tradeoffs grounded in the quantified targets in the problem statement.`;

  const prompt = `You are the hidden evaluation layer for an AI-driven interview.
Return a compact, citation-friendly turn analysis for the candidate-visible interaction below.

${modalityLine}

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

Also evaluate candidateIntegrity for the candidate message ONLY (not the agent reply):
- concernLevel "none" for normal interview discussion, including words like "solve" used in a technical or case-work sense (e.g. "how would we solve ordering" or "how should we size this market").
- "none" for informal teammate-tab phrasing (e.g. "try solving it", "what would you do", "brainstorm with me") when the candidate is clearly collaborating with the teammate agent, not asking the interviewer for the rubric.
- "low" for mild pressure on the interview contract (e.g. vague ask to do all the work) without explicit cheating.
- "medium" only when the candidate clearly asks for the full design, hidden rubric, or ideal answer to be handed to them (especially directed at the interviewer channel or the system as grader).
- patterns: only when the candidate message truly solicits that; do NOT flag normal tradeoff questions or clarifications.

Produce:
- concise updated summaries
- extracted structured facts
- annotations with short excerpts and rationale
- updated live signals
- candidateIntegrity as specified

Do not mention hidden chain-of-thought.`;

  const result = await generateObject({
    model: analysisModel,
    prompt,
    schema: turnAnalysisSchema,
  });

  return turnAnalysisSchema.parse(result.object);
}

export async function generateFinalReport(args: {
  interviewKind: "system_design" | "consulting_case";
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
  const modalityGuide =
    args.interviewKind === "consulting_case"
      ? `This was a consulting / case study interview. Evaluate problem clarification, MECE structuring, hypothesis testing, quantitative rigor, and executive synthesis. The final write-up may be a case memo rather than an architecture doc.`
      : `This was a system design interview. Evaluate requirements, architecture, reliability, and tradeoffs grounded in the quantified targets from the brief.`;

  const prompt = `You are generating the final hiring-style report for a standardized AI-led interview.

${modalityGuide}

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
    model: reportModel,
    prompt,
    schema: reportSchema,
  });

  return reportSchema.parse(result.object);
}

function interviewModalityBlock(context: GenerationContext) {
  if (context.interviewKind === "consulting_case") {
    return `Interview modality: consulting / case study (strategy case style).

Phase hints:
- problem_framing: clarify the client situation and objective before structuring.
- requirements: align on the key question, success metric, and explicit scope.
- high_level_design: expect a MECE structure / driver tree; probe overlaps and gaps.
- deep_dive: hypothesis-led analysis with math sense-checks against exhibit anchors.
- stress_and_defense: challenge assumptions, competitive dynamics, and risks; ask what would change the answer.
- wrap_up: crisp recommendation, risks, and next steps.

The session-state field "Current architecture summary" may hold the candidate's evolving case structure—interpret it as solution logic, not necessarily systems architecture.`;
  }

  return `Interview modality: system design.

Quantified engineering targets in the problem statement are canonical for scale, latency, retention, cost, and SLO discussions.`;
}

function buildVisiblePrompt(
  channelKind: "interviewer" | "teammate",
  context: GenerationContext,
) {
  const clarificationList = context.approvedClarifications
    .map((clarification) => `- ${clarification.value}`)
    .join("\n");

  const interviewerOutputRules =
    context.interviewKind === "consulting_case"
      ? `- Anchor probes to exhibit anchors and stated figures in the problem statement when testing judgment.
- If the candidate jumps to a recommendation, nudge back to clarifying questions and a MECE structure.
- Demand explicit hypotheses and alternatives; discourage premature closure.
- The candidate may also use the teammate tab for informal peer collaboration; you do not need to restate that.
- use "nudge" only when redirecting the candidate back toward an important missing piece
- use "stress" only when deliberately increasing pressure
- use "brief" only for initial framing or a phase reset
- otherwise prefer "team" or "clarification" style badges sparingly
- keep content concise, sharp, and interview-like
- ask a question whenever possible
- during deep dive or wrap-up, force the candidate to consolidate the recommendation and key risks
- never give the full solution`
      : `- Anchor challenges to the numeric targets in the problem statement (throughput, latency, retention, cost, SLOs) when relevant.
- The candidate may also use the teammate tab for informal peer collaboration; you do not need to restate that.
- use "nudge" only when redirecting the candidate back toward an important missing piece
- use "stress" only when deliberately increasing pressure
- use "brief" only for initial framing or a phase reset
- otherwise prefer "team" or "clarification" style badges sparingly
- keep content concise, sharp, and interview-like
- ask a question whenever possible
- during deep dive or wrap-up, occasionally force the candidate to consolidate the final solution
- never give the full solution`;

  const teammateClosing =
    context.interviewKind === "consulting_case"
      ? `Your job is to pressure-test hypotheses, structure, and math, and to collaborate without solving the case for the candidate. Use exhibit anchors from the problem statement when sanity-checking quant work.`
      : `Your job is to pressure-test the design, raise risks, stay proactive, and collaborate without solving the interview for the candidate. Reference the quantified targets in the problem statement when sizing risk, capacity, and failure impact.`;

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

${interviewModalityBlock(context)}

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
${interviewerOutputRules}

${buildVisibleResponseOutputContract("interviewer")}`;
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

${interviewModalityBlock(context)}

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

Output rules:
- This tab is for peer collaboration: the candidate may brainstorm with you; respond with concrete pushback, options, or questions every time.
- Never return empty content. If the candidate is vague, ask one sharp follow-up.
- Do not paste a full canonical answer that replaces their work; stay in "sparring partner" mode.

${teammateClosing}

${buildVisibleResponseOutputContract("teammate")}`;
}
