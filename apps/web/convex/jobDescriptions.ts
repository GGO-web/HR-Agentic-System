import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new job description
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    companyId: v.id("companies"),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const jobDescriptionId = await ctx.db.insert("jobDescriptions", {
      title: args.title,
      description: args.description,
      companyId: args.companyId,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return jobDescriptionId;
  },
});

// Get job description by ID
export const getById = query({
  args: { id: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get job descriptions by company ID
export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobDescriptions")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

// Update job description
export const update = mutation({
  args: {
    id: v.id("jobDescriptions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Only include fields that were provided
    const fieldsToUpdate: any = { ...updates, updatedAt: Date.now() };
    
    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});

// Delete job description
export const remove = mutation({
  args: { id: v.id("jobDescriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
