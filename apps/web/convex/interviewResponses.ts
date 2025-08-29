import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new interview response
export const create = mutation({
  args: {
    interviewSessionId: v.id("interviewSessions"),
    questionId: v.id("interviewQuestions"),
    audioUrl: v.string(),
    transcription: v.optional(v.string()),
    aiAnalysis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const responseId = await ctx.db.insert("interviewResponses", {
      interviewSessionId: args.interviewSessionId,
      questionId: args.questionId,
      audioUrl: args.audioUrl,
      transcription: args.transcription,
      aiAnalysis: args.aiAnalysis,
      createdAt: Date.now(),
    });
    
    return responseId;
  },
});

// Get responses by interview session ID
export const getByInterviewSession = query({
  args: { interviewSessionId: v.id("interviewSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewResponses")
      .withIndex("by_interview_session", (q) => q.eq("interviewSessionId", args.interviewSessionId))
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

// Update response with transcription and AI analysis
export const updateAnalysis = mutation({
  args: {
    id: v.id("interviewResponses"),
    transcription: v.optional(v.string()),
    aiAnalysis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, updates);
    return id;
  },
});
