import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import { UserRole } from "@/types/userRole"

export default defineSchema({
  // Companies table to store company information
  companies: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()), // URL to the company logo stored in S3
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    clerkId: v.string(), // Clerk organization ID
  }).index("by_clerk_id", ["clerkId"]),

  // Users table to store user information
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal(UserRole.HR_MANAGER),
      v.literal(UserRole.CANDIDATE),
    ), // Strict role validation
    companyId: v.optional(v.id("companies")),
    createdAt: v.number(),
    updatedAt: v.number(),
    clerkId: v.string(), // Clerk user ID
    isActive: v.boolean(), // Track if user is active
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_company", ["companyId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Job descriptions table
  jobDescriptions: defineTable({
    title: v.string(),
    description: v.string(),
    files: v.array(v.id("attachments")), // Array of attachment IDs
    companyId: v.id("companies"),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  }).index("by_company", ["companyId"]),

  // Attachments table
  attachments: defineTable({
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

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
    candidateEmail: v.string(),
    jobDescriptionId: v.id("jobDescriptions"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
    ), // "scheduled", "in_progress", "completed"
    scheduledAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_candidate", ["candidateEmail"])
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

  // Interview invitations table
  interviewInvitations: defineTable({
    jobDescriptionId: v.id("jobDescriptions"),
    candidateEmail: v.string(),
    candidateName: v.optional(v.string()),
    invitedBy: v.id("users"), // HR manager who sent the invitation
    status: v.union(
      v.literal("pending"), // Invitation sent, waiting for candidate to accept
      v.literal("accepted"), // Candidate accepted the invitation
      v.literal("declined"), // Candidate declined the invitation
      v.literal("expired"), // Invitation expired
    ),
    invitationToken: v.string(), // Unique token for invitation link
    expiresAt: v.number(), // Expiration timestamp
    acceptedAt: v.optional(v.number()),
    declinedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_job_description", ["jobDescriptionId"])
    .index("by_candidate_email", ["candidateEmail"])
    .index("by_invitation_token", ["invitationToken"])
    .index("by_status", ["status"]),
})
