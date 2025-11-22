import { type Id } from "@convex/_generated/dataModel";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Create a new job description
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    files: v.array(v.id("attachments")),
    companyId: v.id("companies"),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const jobDescriptionId = await ctx.db.insert("jobDescriptions", {
      title: args.title,
      description: args.description,
      files: args.files,
      companyId: args.companyId,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return jobDescriptionId;
  },
});

// Update a job description
export const update = mutation({
  args: {
    id: v.id("jobDescriptions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    files: v.optional(v.array(v.id("attachments"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const fieldsToUpdate: {
      title?: string;
      description?: string;
      files?: Id<"attachments">[];
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (updates.title !== undefined) {
      fieldsToUpdate.title = updates.title;
    }
    if (updates.description !== undefined) {
      fieldsToUpdate.description = updates.description;
    }
    if (updates.files !== undefined) {
      fieldsToUpdate.files = updates.files;
    }

    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});

// Remove (delete) a job description
export const remove = mutation({
  args: { id: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Get job description by ID
export const getById = query({
  args: { id: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all job descriptions for a company
export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobDescriptions")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

// Get candidates with resumes for a specific job description
export const getCandidatesWithResumes = query({
  args: { jobDescriptionId: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    // Get all accepted invitations for this job
    const invitations = await ctx.db
      .query("interviewInvitations")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Get candidates with their resume attachments
    const candidates = await Promise.all(
      invitations.map(async (invitation) => {
        const candidate = await ctx.db
          .query("users")
          .withIndex("by_email", (q) =>
            q.eq("email", invitation.candidateEmail),
          )
          .first();

        if (!candidate || candidate.role !== "candidate") {
          return null;
        }

        // Get resume attachment if exists
        let resumeAttachment = null;
        if (candidate.resumeAttachmentId) {
          resumeAttachment = await ctx.db.get(candidate.resumeAttachmentId);
        }

        return {
          candidate,
          invitation,
          resumeAttachment,
        };
      }),
    );

    // Filter out null values and return only candidates with resumes
    return candidates.filter(
      (item): item is NonNullable<typeof item> =>
        item !== null && item.resumeAttachment !== null,
    );
  },
});
