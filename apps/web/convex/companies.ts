import { v } from "convex/values"

import { mutation, query } from "./_generated/server"

// Create a new company
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkId, ...companyData } = args
    const companyId = await ctx.db.insert("companies", {
      ...companyData,
      isActive: true,
      clerkId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return companyId
  },
})

// Get company by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("companies")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()
  },
})

// Get company by ID
export const getById = query({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// Update company
export const update = mutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // Only include fields that were provided
    const fieldsToUpdate = { ...updates, updatedAt: Date.now() }

    await ctx.db.patch(id, fieldsToUpdate)
    return id
  },
})
