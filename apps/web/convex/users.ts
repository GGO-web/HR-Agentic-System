import { type Id } from "@convex/_generated/dataModel";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

import { UserRole } from "@/types/userRole";

// Create a new user
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal(UserRole.HR_MANAGER),
      v.literal(UserRole.CANDIDATE),
    ),
    companyId: v.optional(v.id("companies")),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: args.role,
      companyId: args.companyId,
      clerkId: args.clerkId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
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

// Get user by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
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

// Get users by role
export const getByRole = query({
  args: {
    role: v.union(
      v.literal(UserRole.HR_MANAGER),
      v.literal(UserRole.CANDIDATE),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
  },
});

// Update user
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal(UserRole.HR_MANAGER), v.literal(UserRole.CANDIDATE)),
    ),
    companyId: v.optional(v.id("companies")),
    resumeAttachmentId: v.optional(v.id("attachments")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Only include fields that were provided
    const fieldsToUpdate = { ...updates, updatedAt: Date.now() };

    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});

// Update candidate profile (simplified mutation for candidates)
// Note: Profile picture is managed by Clerk and accessed via user.imageUrl
export const updateCandidateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    resumeAttachmentId: v.optional(v.id("attachments")),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    // Verify the user exists and is a candidate
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== UserRole.CANDIDATE) {
      throw new Error("Only candidates can update their profile");
    }

    // Only include fields that were provided
    const fieldsToUpdate: {
      name?: string;
      resumeAttachmentId?: Id<"attachments">;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
      resumeAttachmentId: updates.resumeAttachmentId,
    };

    if (updates.name !== undefined) {
      fieldsToUpdate.name = updates.name;
    }

    await ctx.db.patch(userId, fieldsToUpdate);
    return userId;
  },
});

// Delete user (soft delete by setting isActive to false)
export const deactivate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Sync user from Clerk webhook
export const syncFromClerk = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal(UserRole.HR_MANAGER),
      v.literal(UserRole.CANDIDATE),
    ),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        role: args.role,
        companyId: args.companyId,
        updatedAt: Date.now(),
        isActive: true,
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        name: args.name,
        email: args.email,
        role: args.role,
        companyId: args.companyId,
        clerkId: args.clerkId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      });
    }
  },
});
