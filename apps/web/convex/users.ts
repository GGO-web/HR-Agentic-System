import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new user
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.string(),
    companyId: v.optional(v.id("companies")),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: args.role,
      companyId: args.companyId,
      clerkId: args.clerkId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return userId;
  },
});

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get users by company ID
export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

// Update user
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Only include fields that were provided
    const fieldsToUpdate: any = { ...updates, updatedAt: Date.now() };
    
    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});
