import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Create or update resume evaluation results
export const createOrUpdate = mutation({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
    jobDescriptionText: v.string(),
    results: v.array(
      v.object({
        candidate_id: v.string(),
        scores: v.object({
          vector_score: v.number(),
          bm25_score: v.number(),
          hybrid_score: v.number(),
        }),
        report: v.optional(
          v.object({
            fit_category: v.string(),
            overall_score: v.number(),
            missing_skills: v.array(v.string()),
            explanation: v.string(),
            strengths: v.array(v.string()),
            weaknesses: v.array(v.string()),
          }),
        ),
      }),
    ),
    totalCandidates: v.number(),
  },
  handler: async (ctx, args) => {
    // Create a simple hash of the job description text for lookup
    // Using first 100 chars normalized as hash (in production, consider using crypto)
    const jobDescriptionHash = args.jobDescriptionText
      .substring(0, 100)
      .replace(/\s+/g, "")
      .toLowerCase();

    // Check if evaluation already exists
    const existing = await ctx.db
      .query("resumeEvaluations")
      .withIndex("by_job_description_hash", (q) =>
        q
          .eq("jobDescriptionId", args.jobDescriptionId)
          .eq("jobDescriptionHash", jobDescriptionHash),
      )
      .first();

    if (existing) {
      // Update existing evaluation
      await ctx.db.patch(existing._id, {
        results: args.results,
        totalCandidates: args.totalCandidates,
        jobDescriptionText: args.jobDescriptionText,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new evaluation
      const evaluationId = await ctx.db.insert("resumeEvaluations", {
        jobDescriptionId: args.jobDescriptionId,
        jobDescriptionHash,
        jobDescriptionText: args.jobDescriptionText,
        results: args.results,
        totalCandidates: args.totalCandidates,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return evaluationId;
    }
  },
});

// Get resume evaluation results by job description ID and hash
export const getByJobDescription = query({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
    jobDescriptionText: v.string(),
  },
  handler: async (ctx, args) => {
    // Create hash same way as in createOrUpdate
    const jobDescriptionHash = args.jobDescriptionText
      .substring(0, 100)
      .replace(/\s+/g, "")
      .toLowerCase();

    const evaluation = await ctx.db
      .query("resumeEvaluations")
      .withIndex("by_job_description_hash", (q) =>
        q
          .eq("jobDescriptionId", args.jobDescriptionId)
          .eq("jobDescriptionHash", jobDescriptionHash),
      )
      .first();

    if (!evaluation) return null;

    // Also check if the text matches (hash collision protection)
    if (evaluation.jobDescriptionText === args.jobDescriptionText) {
      return evaluation;
    }

    return null;
  },
});

// Get all evaluations for a job description
export const getAllByJobDescription = query({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("resumeEvaluations")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .order("desc")
      .collect();
  },
});

