import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getReportBySessionId, getSessionByPublicId } from "./lib/db";
import { reportViewValidator } from "./lib/validators";

export const getReportBySessionPublicId = query({
  args: { sessionPublicId: v.string() },
  returns: v.union(v.null(), reportViewValidator),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      return null;
    }

    const report = await getReportBySessionId(ctx, session._id);
    if (!report) {
      return null;
    }

    const pdfUrl =
      report.pdfStorageId !== null ? await ctx.storage.getUrl(report.pdfStorageId) : null;

    return {
      sessionPublicId: session.publicId,
      status: report.status,
      reportJson: report.reportJson,
      finalRecommendation: report.finalRecommendation,
      pdfUrl,
      updatedAt: report.updatedAt,
    };
  },
});

export const createPdfUploadUrl = mutation({
  args: { sessionPublicId: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      throw new Error("Session not found.");
    }

    const report = await getReportBySessionId(ctx, session._id);
    if (!report || report.reportJson === null) {
      throw new Error("Report is not ready yet.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const attachPdfArtifact = mutation({
  args: {
    sessionPublicId: v.string(),
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      throw new Error("Session not found.");
    }

    const report = await getReportBySessionId(ctx, session._id);
    if (!report) {
      throw new Error("Report not found.");
    }

    await ctx.db.patch(report._id, {
      pdfStorageId: args.storageId,
      status: "ready",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("reportArtifacts", {
      reportId: report._id,
      kind: "pdf",
      storageId: args.storageId,
      createdAt: Date.now(),
    });

    return null;
  },
});
