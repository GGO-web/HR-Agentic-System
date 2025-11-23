import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Create a new interview session
export const create = mutation({
  args: {
    candidateEmail: v.string(),
    jobDescriptionId: v.id("jobDescriptions"),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("interviewSessions", {
      candidateEmail: args.candidateEmail,
      jobDescriptionId: args.jobDescriptionId,
      status: "scheduled",
      scheduledAt: args.scheduledAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return sessionId;
  },
});

// Get interview session by ID
export const getById = query({
  args: { id: v.id("interviewSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get interview sessions by candidate ID
export const getByCandidate = query({
  args: { candidateEmail: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewSessions")
      .withIndex("by_candidate", (q) =>
        q.eq("candidateEmail", args.candidateEmail),
      )
      .collect();
  },
});

// Get interview sessions by job description ID
export const getByJobDescription = query({
  args: { jobDescriptionId: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewSessions")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .collect();
  },
});

// Get interview session by ElevenLabs conversation ID
export const getByConversationId = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query("interviewSessions").collect();
    return (
      sessions.find(
        (s) => s.elevenlabsConversationId === args.conversationId,
      ) || null
    );
  },
});

// Start an interview session
export const startSession = mutation({
  args: {
    id: v.id("interviewSessions"),
    elevenlabsConversationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "in_progress",
      startedAt: Date.now(),
      updatedAt: Date.now(),
      ...(args.elevenlabsConversationId && {
        elevenlabsConversationId: args.elevenlabsConversationId,
      }),
    });

    return args.id;
  },
});

// Send an interview session for review
export const sendSessionForReview = mutation({
  args: {
    id: v.id("interviewSessions"),
    transcriptUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "in_review",
      submittedAt: Date.now(),
      updatedAt: Date.now(),
      ...(args.transcriptUrl && { transcriptUrl: args.transcriptUrl }),
    });

    return args.id;
  },
});

// Complete an interview session (after analysis is done)
export const sessionComplete = mutation({
  args: {
    id: v.id("interviewSessions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
