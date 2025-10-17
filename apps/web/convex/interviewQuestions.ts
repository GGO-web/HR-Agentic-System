import { v } from "convex/values";

import { internal } from "./_generated/api";
import { type Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Create a new interview question
export const create = mutation({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
    question: v.string(),
    order: v.number(),
    isAIGenerated: v.boolean(),
  },
  handler: async (ctx, args) => {
    const questionId = await ctx.db.insert("interviewQuestions", {
      jobDescriptionId: args.jobDescriptionId,
      question: args.question,
      order: args.order,
      isAIGenerated: args.isAIGenerated,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return questionId;
  },
});

// Get questions by job description ID
export const getByJobDescription = query({
  args: { jobDescriptionId: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewQuestions")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .collect();
  },
});

// Get question by ID
export const getById = query({
  args: { id: v.id("interviewQuestions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update question
export const update = mutation({
  args: {
    id: v.id("interviewQuestions"),
    question: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Only include fields that were provided
    const fieldsToUpdate = { ...updates, updatedAt: Date.now() };

    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});

// Delete question
export const remove = mutation({
  args: { id: v.id("interviewQuestions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteByJobDescription = mutation({
  args: { jobDescriptionId: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("interviewQuestions")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .collect();

    await Promise.all(
      questions.map((question: Doc<"interviewQuestions">) =>
        ctx.runMutation(internal.interviewQuestions.remove, {
          id: question._id,
        }),
      ),
    );
  },
});
