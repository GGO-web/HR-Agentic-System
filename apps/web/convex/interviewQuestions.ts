import { v } from "convex/values";

import { type Doc, type Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Create a new interview question
export const create = mutation({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
    question: v.optional(v.string()), // Legacy field
    question_text: v.optional(v.string()), // New structured field
    category: v.optional(
      v.union(
        v.literal("intro"),
        v.literal("strengths"),
        v.literal("weaknesses"),
        v.literal("motivation"),
        v.literal("vision"),
        v.literal("challenge"),
        v.literal("culture"),
        v.literal("resilience"),
        v.literal("achievement"),
        v.literal("closing"),
        v.literal("technical"),
        v.literal("custom"),
      ),
    ),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
    expected_keywords: v.optional(v.array(v.string())),
    order: v.number(),
    isAIGenerated: v.boolean(),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"))),
  },
  handler: async (ctx, args) => {
    // Use question_text if provided, otherwise fall back to question for backward compatibility
    const questionText = args.question_text || args.question || "";

    // Build insert object, only including optional fields if they are provided
    const insertData: {
      jobDescriptionId: Id<"jobDescriptions">;
      question: string;
      question_text: string;
      order: number;
      isAIGenerated: boolean;
      status: "pending" | "approved";
      createdAt: number;
      updatedAt: number;
      category?:
        | "intro"
        | "strengths"
        | "weaknesses"
        | "motivation"
        | "vision"
        | "challenge"
        | "culture"
        | "resilience"
        | "achievement"
        | "closing"
        | "technical"
        | "custom";
      difficulty?: "easy" | "medium" | "hard";
      expected_keywords?: string[];
    } = {
      jobDescriptionId: args.jobDescriptionId,
      question: questionText, // Keep for backward compatibility
      question_text: args.question_text || questionText,
      order: args.order,
      isAIGenerated: args.isAIGenerated,
      status: args.status ?? "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Only include optional fields if they are provided and not null
    if (args.category !== undefined && args.category !== null) {
      insertData.category = args.category;
    }
    if (args.difficulty !== undefined && args.difficulty !== null) {
      insertData.difficulty = args.difficulty;
    }
    if (
      args.expected_keywords !== undefined &&
      args.expected_keywords !== null
    ) {
      insertData.expected_keywords = args.expected_keywords;
    }

    const questionId = await ctx.db.insert("interviewQuestions", insertData);

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
    question: v.optional(v.string()), // Legacy field
    question_text: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("intro"),
        v.literal("strengths"),
        v.literal("weaknesses"),
        v.literal("motivation"),
        v.literal("vision"),
        v.literal("challenge"),
        v.literal("culture"),
        v.literal("resilience"),
        v.literal("achievement"),
        v.literal("closing"),
        v.literal("technical"),
        v.literal("custom"),
      ),
    ),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
    expected_keywords: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Build update object, only including fields that are provided and not null
    const fieldsToUpdate: {
      updatedAt: number;
      question_text?: string;
      question?: string;
      category?:
        | "intro"
        | "strengths"
        | "weaknesses"
        | "motivation"
        | "vision"
        | "challenge"
        | "culture"
        | "resilience"
        | "achievement"
        | "closing"
        | "technical"
        | "custom";
      difficulty?: "easy" | "medium" | "hard";
      expected_keywords?: string[];
      order?: number;
      status?: "pending" | "approved";
    } = { updatedAt: Date.now() };

    // Handle question_text and legacy question field
    if (updates.question_text !== undefined && updates.question_text !== null) {
      fieldsToUpdate.question_text = updates.question_text;
      fieldsToUpdate.question = updates.question_text; // Update legacy field too
    } else if (updates.question !== undefined && updates.question !== null) {
      fieldsToUpdate.question = updates.question;
      fieldsToUpdate.question_text = updates.question;
    }

    // Only include optional fields if they are provided and not null
    if (updates.category !== undefined && updates.category !== null) {
      fieldsToUpdate.category = updates.category;
    }
    if (updates.difficulty !== undefined && updates.difficulty !== null) {
      fieldsToUpdate.difficulty = updates.difficulty;
    }
    if (
      updates.expected_keywords !== undefined &&
      updates.expected_keywords !== null
    ) {
      fieldsToUpdate.expected_keywords = updates.expected_keywords;
    }
    if (updates.order !== undefined && updates.order !== null) {
      fieldsToUpdate.order = updates.order;
    }
    if (updates.status !== undefined && updates.status !== null) {
      fieldsToUpdate.status = updates.status;
    }

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

    // Delete all questions directly
    await Promise.all(
      questions.map((question: Doc<"interviewQuestions">) =>
        ctx.db.delete(question._id),
      ),
    );
  },
});

// Approve a single question (Human-in-the-loop: Approve)
export const approve = mutation({
  args: { id: v.id("interviewQuestions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "approved",
      updatedAt: Date.now(),
    });
  },
});

// Approve all questions for a job description (Human-in-the-loop: Approve & Publish)
export const approveAll = mutation({
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
        ctx.db.patch(question._id, {
          status: "approved",
          updatedAt: Date.now(),
        }),
      ),
    );
  },
});
