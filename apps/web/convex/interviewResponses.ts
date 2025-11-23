import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Create a new interview response
export const create = mutation({
  args: {
    interviewSessionId: v.id("interviewSessions"),
    questionId: v.id("interviewQuestions"),
    audioUrl: v.string(),
    transcription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const responseId = await ctx.db.insert("interviewResponses", {
      interviewSessionId: args.interviewSessionId,
      questionId: args.questionId,
      audioUrl: args.audioUrl,
      transcription: args.transcription,
      createdAt: Date.now(),
    });

    return responseId;
  },
});

// Create interview response with analysis results
export const createWithAnalysis = mutation({
  args: {
    interviewSessionId: v.id("interviewSessions"),
    questionId: v.id("interviewQuestions"),
    audioUrl: v.string(),
    transcription: v.optional(v.string()),
    contentScore: v.optional(v.number()),
    confidenceScore: v.optional(v.number()),
    finalScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const responseId = await ctx.db.insert("interviewResponses", {
      interviewSessionId: args.interviewSessionId,
      questionId: args.questionId,
      audioUrl: args.audioUrl,
      transcription: args.transcription,
      contentScore: args.contentScore,
      confidenceScore: args.confidenceScore,
      finalScore: args.finalScore,
      createdAt: Date.now(),
    });

    return responseId;
  },
});

// Update interview response with analysis results
export const updateAnalysis = mutation({
  args: {
    id: v.id("interviewResponses"),
    audioUrl: v.optional(v.string()),
    transcription: v.optional(v.string()),
    contentScore: v.optional(v.number()),
    confidenceScore: v.optional(v.number()),
    finalScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Only update fields that are provided
    const updateData: {
      audioUrl?: string;
      transcription?: string;
      contentScore?: number;
      confidenceScore?: number;
      finalScore?: number;
    } = {};

    if (updates.audioUrl !== undefined) {
      updateData.audioUrl = updates.audioUrl;
    }
    if (updates.transcription !== undefined) {
      updateData.transcription = updates.transcription;
    }
    if (updates.contentScore !== undefined) {
      updateData.contentScore = updates.contentScore;
    }
    if (updates.confidenceScore !== undefined) {
      updateData.confidenceScore = updates.confidenceScore;
    }
    if (updates.finalScore !== undefined) {
      updateData.finalScore = updates.finalScore;
    }

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Get response by session and question (for finding existing responses)
export const getBySessionAndQuestion = query({
  args: {
    interviewSessionId: v.id("interviewSessions"),
    questionId: v.id("interviewQuestions"),
  },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("interviewResponses")
      .withIndex("by_interview_session", (q) =>
        q.eq("interviewSessionId", args.interviewSessionId),
      )
      .collect();

    return responses.find((r) => r.questionId === args.questionId) || null;
  },
});

// Get responses by interview session ID
export const getByInterviewSession = query({
  args: { interviewSessionId: v.id("interviewSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewResponses")
      .withIndex("by_interview_session", (q) =>
        q.eq("interviewSessionId", args.interviewSessionId),
      )
      .collect();
  },
});

// Get responses by question ID
export const getByQuestion = query({
  args: { questionId: v.id("interviewQuestions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewResponses")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .collect();
  },
});
