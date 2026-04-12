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
    streamResponse: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const context = await ctx.runQuery(internal.orchestrator.getProcessingContext, {
        sessionId: args.sessionId,
        channelKind: args.channelKind,
        candidateMessageId: args.candidateMessageId,
      });

      let lastFlushedContent = "";
      let lastFlushAt = 0;
      const streamingEnabled = args.streamResponse ?? false;

      const response = await generateVisibleResponse(ctx, {
        channelKind: args.channelKind,
        context,
        onPartialContent: streamingEnabled
          ? async (content: string) => {
              const now = Date.now();
              const shouldFlush =
                content.length > 0 &&
                (content.length - lastFlushedContent.length >= 32 || now - lastFlushAt >= 150);

              if (!shouldFlush || content === lastFlushedContent) {
                return;
              }

              lastFlushedContent = content;
              lastFlushAt = now;

              await ctx.runMutation(internal.orchestrator.upsertStreamingResponse, {
                sessionId: args.sessionId,
                channelId: args.channelId,
                status: "streaming",
                content,
              });
            }
          : undefined,
      });

      if (streamingEnabled && response.content !== lastFlushedContent) {
        await ctx.runMutation(internal.orchestrator.upsertStreamingResponse, {
          sessionId: args.sessionId,
          channelId: args.channelId,
          status: "streaming",
          content: response.content,
        });
      }

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
    } catch (error) {
      await ctx.runMutation(internal.orchestrator.markResponseGenerationFailed, {
        channelId: args.channelId,
      });
      throw error;
    }
  },
});
