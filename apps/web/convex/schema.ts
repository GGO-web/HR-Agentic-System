import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Companies table to store company information
  companies: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    clerkId: v.string(), // Clerk organization ID
  }).index("by_clerk_id", ["clerkId"]),

  // Users table to store user information
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("hr_manager"), v.literal("candidate")), // Strict role validation
    companyId: v.optional(v.id("companies")),
    createdAt: v.number(),
    updatedAt: v.number(),
    clerkId: v.string(), // Clerk user ID
    isActive: v.boolean(), // Track if user is active
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_company", ["companyId"])
    .index("by_role", ["role"]),

  // Job descriptions table
  jobDescriptions: defineTable({
    title: v.string(),
    description: v.string(),
    companyId: v.id("companies"),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_company", ["companyId"]),

  // Interview questions table
  interviewQuestions: defineTable({
    jobDescriptionId: v.id("jobDescriptions"),
    question: v.string(),
    order: v.number(), // Order of the question in the interview
    isAIGenerated: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_job_description", ["jobDescriptionId"]),

  // Interview sessions table
  interviewSessions: defineTable({
    candidateId: v.id("users"),
    jobDescriptionId: v.id("jobDescriptions"),
    status: v.string(), // "scheduled", "in_progress", "completed"
    scheduledAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_job_description", ["jobDescriptionId"]),

  // Interview responses table
  interviewResponses: defineTable({
    interviewSessionId: v.id("interviewSessions"),
    questionId: v.id("interviewQuestions"),
    audioUrl: v.string(), // URL to the stored audio file
    transcription: v.optional(v.string()),
    aiAnalysis: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_interview_session", ["interviewSessionId"])
    .index("by_question", ["questionId"]),
})
