import { v } from "convex/values"

import { mutation, query } from "./_generated/server"

// Utility functions for invitation management
function generateInvitationToken(): string {
  // Generate a secure random token
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function calculateExpirationDate(): number {
  const now = Date.now()
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
  return now + sevenDaysInMs
}

function generateInvitationLink(token: string): string {
  // In production, this would use the actual domain
  return `${process.env.SITE_URL}/invitation/${token}`
}

// Mock email service - in production, integrate with a real email service
async function sendInvitationEmail(data: {
  candidateName: string
  candidateEmail: string
  jobTitle: string
  companyName: string
  invitationLink: string
  personalMessage?: string
}): Promise<void> {
  // Mock implementation - in production, replace with actual email service
  console.log("📧 Invitation email would be sent:", {
    to: data.candidateEmail,
    subject: `Interview Invitation - ${data.jobTitle} at ${data.companyName}`,
    invitationLink: data.invitationLink,
    personalMessage: data.personalMessage,
  })
}

// Create a new interview invitation
export const create = mutation({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
    candidateEmail: v.string(),
    invitedBy: v.id("users"),
    personalMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get job description and company details for email
    const jobDescription = await ctx.db.get(args.jobDescriptionId)
    if (!jobDescription) {
      throw new Error("Job description not found")
    }

    const company = await ctx.db.get(jobDescription.companyId)
    if (!company) {
      throw new Error("Company not found")
    }

    // Check if candidate exists
    const candidate = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.candidateEmail))
      .first()

    if (!candidate) {
      throw new Error(
        "Account not found. Please ensure the candidate has registered.",
      )
    }

    // Check if candidate has the correct role
    if (candidate.role !== "candidate") {
      throw new Error(
        "This email belongs to an HR manager. Only candidates can be invited to interviews.",
      )
    }

    // Check if candidate is already invited for this job
    const existingInvitation = await ctx.db
      .query("interviewInvitations")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .filter((q) => q.eq(q.field("candidateEmail"), args.candidateEmail))
      .first()

    if (existingInvitation) {
      throw new Error(
        "This candidate has already been invited for this position.",
      )
    }

    // Generate unique invitation token
    const invitationToken = generateInvitationToken()
    const expiresAt = calculateExpirationDate()

    const invitationId = await ctx.db.insert("interviewInvitations", {
      jobDescriptionId: args.jobDescriptionId,
      candidateEmail: args.candidateEmail,
      invitedBy: args.invitedBy,
      status: "pending",
      invitationToken,
      expiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Send invitation email (in production, this would be handled by a background job)
    try {
      await sendInvitationEmail({
        candidateName: candidate.name || "Candidate",
        candidateEmail: args.candidateEmail,
        jobTitle: jobDescription.title,
        companyName: company.name,
        invitationLink: generateInvitationLink(invitationToken),
        personalMessage: args.personalMessage,
      })
    } catch (error) {
      console.error("Failed to send invitation email:", error)
      // Don't fail the mutation if email fails, but log the error
    }

    return invitationId
  },
})

// Get invitation by token
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("interviewInvitations")
      .withIndex("by_invitation_token", (q) =>
        q.eq("invitationToken", args.token),
      )
      .first()

    if (!invitation) {
      return null
    }

    // Check if invitation is expired
    if (invitation.expiresAt < Date.now() && invitation.status === "pending") {
      // Return expired status without updating the database
      return { ...invitation, status: "expired" }
    }

    return invitation
  },
})

// Get invitations by job description
export const getByJobDescription = query({
  args: { jobDescriptionId: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewInvitations")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .collect()
  },
})

// Get invitations by candidate email
export const getByCandidateEmail = query({
  args: { candidateEmail: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviewInvitations")
      .withIndex("by_candidate_email", (q) =>
        q.eq("candidateEmail", args.candidateEmail),
      )
      .collect()
  },
})

// Accept invitation
export const accept = mutation({
  args: {
    invitationId: v.id("interviewInvitations"),
    candidateEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId)

    if (!invitation) {
      throw new Error("Invitation not found")
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is no longer pending")
    }

    if (invitation.expiresAt < Date.now()) {
      throw new Error("Invitation has expired")
    }

    // Update invitation status
    await ctx.db.patch(args.invitationId, {
      status: "accepted",
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Create interview session
    const sessionId = await ctx.db.insert("interviewSessions", {
      candidateEmail: args.candidateEmail,
      jobDescriptionId: invitation.jobDescriptionId,
      status: "scheduled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return { invitationId: args.invitationId, sessionId }
  },
})

// Decline invitation
export const decline = mutation({
  args: { invitationId: v.id("interviewInvitations") },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId)

    if (!invitation) {
      throw new Error("Invitation not found")
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is no longer pending")
    }

    await ctx.db.patch(args.invitationId, {
      status: "declined",
      declinedAt: Date.now(),
      updatedAt: Date.now(),
    })

    return args.invitationId
  },
})

// Get job descriptions for candidate (invited ones)
export const getInvitedJobDescriptions = query({
  args: { candidateEmail: v.string() },
  handler: async (ctx, args) => {
    const invitations = await ctx.db
      .query("interviewInvitations")
      .withIndex("by_candidate_email", (q) =>
        q.eq("candidateEmail", args.candidateEmail),
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect()

    const jobDescriptions = await Promise.all(
      invitations.map(async (invitation) => {
        const jobDescription = await ctx.db.get(invitation.jobDescriptionId)
        const company = jobDescription
          ? await ctx.db.get(jobDescription.companyId)
          : null

        // Find the interview session for this invitation
        const interviewSession = await ctx.db
          .query("interviewSessions")
          .withIndex("by_candidate", (q) =>
            q.eq("candidateEmail", args.candidateEmail),
          )
          .filter((q) =>
            q.eq(q.field("jobDescriptionId"), invitation.jobDescriptionId),
          )
          .first()

        return {
          ...jobDescription,
          company,
          invitation,
          interviewSession,
        }
      }),
    )

    return jobDescriptions.filter(Boolean)
  },
})

// Update invitation status
export const updateStatus = mutation({
  args: {
    invitationId: v.id("interviewInvitations"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.invitationId, {
      status: args.status,
      updatedAt: Date.now(),
    })

    return args.invitationId
  },
})

// Delete invitation
export const remove = mutation({
  args: { invitationId: v.id("interviewInvitations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.invitationId)
    return args.invitationId
  },
})
