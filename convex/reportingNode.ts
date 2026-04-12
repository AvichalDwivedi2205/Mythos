"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { generateFinalReport } from "./aiRuntime";

export const generateReport = internalAction({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.reporting.getReportContext, {
      sessionId: args.sessionId,
    });

    await ctx.runMutation(internal.reporting.ensureReportRow, {
      sessionId: args.sessionId,
    });

    const report = await generateFinalReport(context);

    await ctx.runMutation(internal.reporting.persistGeneratedReport, {
      sessionId: args.sessionId,
      reportJson: JSON.stringify(report),
      finalRecommendation: report.finalRecommendation,
    });

    return null;
  },
});
