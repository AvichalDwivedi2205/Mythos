import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getSessionByPublicId } from "./lib/db";
import { noteLabelValidator, scratchNoteValidator } from "./lib/validators";

export const listNotes = query({
  args: { sessionPublicId: v.string() },
  returns: v.array(scratchNoteValidator),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      return [];
    }

    const notes = await ctx.db
      .query("scratchNotes")
      .withIndex("by_sessionId_and_sortOrder", (query) => query.eq("sessionId", session._id))
      .order("asc")
      .take(200);

    return notes.map((note) => ({
      id: note._id,
      label: note.label,
      color: note.color,
      content: note.content,
      sortOrder: note.sortOrder,
      archived: note.archived,
    }));
  },
});

export const createNote = mutation({
  args: {
    sessionPublicId: v.string(),
    label: noteLabelValidator,
    color: v.string(),
    content: v.string(),
  },
  returns: v.id("scratchNotes"),
  handler: async (ctx, args) => {
    const session = await getSessionByPublicId(ctx, args.sessionPublicId);
    if (!session) {
      throw new Error("Session not found.");
    }

    const last = await ctx.db
      .query("scratchNotes")
      .withIndex("by_sessionId_and_sortOrder", (query) => query.eq("sessionId", session._id))
      .order("desc")
      .take(1);

    return await ctx.db.insert("scratchNotes", {
      sessionId: session._id,
      label: args.label,
      color: args.color,
      content: args.content,
      sortOrder: last[0]?.sortOrder ? last[0].sortOrder + 1 : 0,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("scratchNotes"),
    content: v.string(),
    label: noteLabelValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      content: args.content,
      label: args.label,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("scratchNotes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
    return null;
  },
});
