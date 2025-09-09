import { v } from "convex/values"

import { internal } from "./_generated/api"
import { action, mutation, query } from "./_generated/server"
import { questionsService } from "./services/questions/questions.service"

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
    })

    return questionId
  },
})

// Get questions by job description ID
export const getByJobDescription = query({
  args: { jobDescriptionId: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewQuestions")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .collect()
  },
})

// Get question by ID
export const getById = query({
  args: { id: v.id("interviewQuestions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// Update question
export const update = mutation({
  args: {
    id: v.id("interviewQuestions"),
    question: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // Only include fields that were provided
    const fieldsToUpdate = { ...updates, updatedAt: Date.now() }

    await ctx.db.patch(id, fieldsToUpdate)
    return id
  },
})

// Delete question
export const remove = mutation({
  args: { id: v.id("interviewQuestions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

export const actionGenerateAndSaveAIQuestions = action({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Call API
    const response = await questionsService.generateQuestions(
      args.title,
      args.description,
    )

    if (!response.ok) {
      throw new Error(`Error generating AI questions: ${response.statusText}`)
    }

    const data = await response.json()
    const aiQuestions = data.questions // assuming returns array

    // 2. Save to Convex DB inside the action using a mutation
    const questionIds = await Promise.all(
      aiQuestions.map((question: string) =>
        ctx.runMutation(internal.interviewQuestions.create, {
          jobDescriptionId: args.jobDescriptionId,
          question,
          order: 0,
          isAIGenerated: true,
        }),
      ),
    )

    return questionIds
  },
})
