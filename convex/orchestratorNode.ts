"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { generateTurnAnalysis, generateVisibleResponse } from "./aiRuntime";
import { channelKindValidator } from "./lib/validators";

export const processCandidateTurn = internalAction({
  args: {
    sessionId: v.id("sessions"),
    channelId: v.id("channels"),
    channelKind: channelKindValidator,
    candidateMessageId: v.id("messages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.orchestrator.getProcessingContext, {
      sessionId: args.sessionId,
      channelKind: args.channelKind,
      candidateMessageId: args.candidateMessageId,
    });

    const response = await generateVisibleResponse(ctx, {
      channelKind: args.channelKind,
      context,
    });

    const persisted = await ctx.runMutation(internal.orchestrator.persistGeneratedResponse, {
      sessionId: args.sessionId,
      channelId: args.channelId,
      channelKind: args.channelKind,
      responseContent: response.content,
      responseMode: response.mode,
      badgeKind: response.badgeKind,
      eventSummary: response.eventSummary,
      shouldAdvancePhase: response.shouldAdvancePhase,
      nextPhase: response.nextPhase,
      usedClarificationBackchannel:
        args.channelKind === "teammate" &&
        response.needsClarification &&
        response.clarificationQuestion !== null,
      clarificationQuestion: response.clarificationQuestion,
    });

    const analysis = await generateTurnAnalysis(context, {
      responseContent: response.content,
      responseBadgeKind: response.badgeKind,
    });

    await ctx.runMutation(internal.orchestrator.applyTurnAnalysis, {
      sessionId: args.sessionId,
      candidateMessageId: args.candidateMessageId,
      responseMessageId: persisted.responseMessageId,
      analysisJson: JSON.stringify(analysis),
    });

    return null;
  },
});
