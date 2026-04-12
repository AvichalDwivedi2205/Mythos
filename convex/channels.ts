import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { getChannelByKind, getSessionByPublicId, getSessionCounters } from "./lib/db";
import {
  sendCandidateMessageResultValidator,
  streamingResponseValidator,
  visibleMessageValidator,
} from "./lib/validators";
import { detectIntegrityWarning } from "../lib/integrity";

const rateLimiter = new RateLimiter(
  components.rateLimiter as unknown as ConstructorParameters<typeof RateLimiter>[0],
  {
  sessionMessages: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 6 },
  },
);

export const listChannelMessages = query({
  args: {
    sessionPublicId: v.string(),
    channelKind: v.union(v.literal("interviewer"), v.literal("teammate")),
  },
  returns: v.array(visibleMessageValidator),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      return [];
    }

    const channel = await getChannelByKind(ctx, session._id, args.channelKind);
    if (!channel) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channelId_and_sequence", (query) => query.eq("channelId", channel._id))
      .order("asc")
      .take(400);

    return messages.map((message) => ({
      id: message._id,
      sequence: message.sequence,
      speakerType: message.speakerType,
      speakerLabel: message.speakerLabel,
      content: message.content,
      phase: message.phase,
      badgeKind: message.badgeKind,
      eventSummary: message.eventSummary,
      createdAt: message.createdAt,
    }));
  },
});

export const sendCandidateMessage = mutation({
  args: {
    sessionPublicId: v.string(),
    channelKind: v.union(v.literal("interviewer"), v.literal("teammate")),
    content: v.string(),
    streamResponse: v.optional(v.boolean()),
  },
  returns: sendCandidateMessageResultValidator,
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      throw new Error("Session not found.");
    }
    if (session.status !== "active") {
      throw new Error("This interview session is no longer active.");
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Message cannot be empty.");
    }

    const warning = detectIntegrityWarning(content);
    if (warning?.blocked) {
      await ctx.db.insert("events", {
        sessionId: session._id,
        channelId: null,
        messageId: null,
        type: "integrity_warning",
        actor: "system",
        target: args.channelKind,
        metadataJson: JSON.stringify({
          code: warning.code,
          title: warning.title,
          detail: warning.detail,
        }),
        createdAt: Date.now(),
      });

      return {
        queued: false,
        blocked: true,
        messageId: null,
        warning,
      };
    }

    const channel = await getChannelByKind(ctx, session._id, args.channelKind);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    await rateLimiter.limit(ctx, "sessionMessages", {
      key: `${session.publicId}:${args.channelKind}`,
      throws: true,
    });

    const counters = await getSessionCounters(ctx, session._id);
    if (!counters) {
      throw new Error("Session counters missing.");
    }

    const sequence = counters.nextSequence + 1;
    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      sessionId: session._id,
      channelId: channel._id,
      threadId: channel.threadId,
      sequence,
      speakerType: "candidate",
      speakerLabel: "You",
      content,
      phase: session.currentPhase,
      badgeKind: null,
      eventSummary: null,
      createdAt: now,
      replyToMessageId: null,
      visibleToCandidate: true,
    });

    await ctx.db.patch(counters._id, {
      nextSequence: sequence,
      candidateMessageCount: counters.candidateMessageCount + 1,
    });

    await ctx.db.insert("events", {
      sessionId: session._id,
      channelId: channel._id,
      messageId,
      type: "message_sent",
      actor: "candidate",
      target: args.channelKind,
      metadataJson: JSON.stringify({
        channelKind: args.channelKind,
        sequence,
      }),
      createdAt: now,
    });

    const runtime = await ctx.db
      .query("agentRuntimeState")
      .withIndex("by_channelId", (query) => query.eq("channelId", channel._id))
      .unique();

    const streamingResponse = await ctx.db
      .query("streamingResponses")
      .withIndex("by_channelId", (query) => query.eq("channelId", channel._id))
      .unique();

    if (runtime) {
      await ctx.db.patch(runtime._id, {
        status: "thinking",
        lastHeartbeatAt: now,
      });
    }

    if (args.streamResponse) {
      if (streamingResponse) {
        await ctx.db.patch(streamingResponse._id, {
          status: "thinking",
          content: "",
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("streamingResponses", {
          sessionId: session._id,
          channelId: channel._id,
          status: "thinking",
          content: "",
          createdAt: now,
          updatedAt: now,
        });
      }
    } else if (streamingResponse) {
      await ctx.db.delete(streamingResponse._id);
    }

    await ctx.scheduler.runAfter(0, internal.orchestratorNode.processCandidateTurn, {
      sessionId: session._id,
      channelId: channel._id,
      channelKind: args.channelKind,
      candidateMessageId: messageId,
      streamResponse: args.streamResponse ?? false,
    });

    return {
      queued: true,
      blocked: false,
      messageId,
      warning: null,
    };
  },
});

export const getChannelStreamingResponse = query({
  args: {
    sessionPublicId: v.string(),
    channelKind: v.union(v.literal("interviewer"), v.literal("teammate")),
  },
  returns: v.union(v.null(), streamingResponseValidator),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      return null;
    }

    const channel = await getChannelByKind(ctx, session._id, args.channelKind);
    if (!channel) {
      return null;
    }

    const streamingResponse = await ctx.db
      .query("streamingResponses")
      .withIndex("by_channelId", (query) => query.eq("channelId", channel._id))
      .unique();

    if (!streamingResponse) {
      return null;
    }

    return {
      status: streamingResponse.status,
      content: streamingResponse.content,
      createdAt: streamingResponse.createdAt,
      updatedAt: streamingResponse.updatedAt,
    };
  },
});
