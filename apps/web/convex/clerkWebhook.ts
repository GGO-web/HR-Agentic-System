import { v } from "convex/values"

import { mutation } from "./_generated/server"

// Handle Clerk webhook for user creation/updates
export const handleUserWebhook = mutation({
  args: {
    type: v.string(), // "user.created", "user.updated", "user.deleted"
    data: v.object({
      id: v.string(),
      email_addresses: v.array(
        v.object({
          email_address: v.string(),
          id: v.string(),
        }),
      ),
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      public_metadata: v.optional(
        v.object({
          role: v.optional(v.string()),
          companyId: v.optional(v.string()),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const { type, data } = args

    // Extract user information
    const clerkId = data.id
    const email = data.email_addresses[0]?.email_address || ""
    const firstName = data.first_name || ""
    const lastName = data.last_name || ""
    const name = `${firstName} ${lastName}`.trim() || email

    // Get role from public metadata (default to candidate if not specified)
    const role =
      data.public_metadata?.role === "hr_manager" ? "hr_manager" : "candidate"
    const companyId = data.public_metadata?.companyId

    switch (type) {
      case "user.created":
      case "user.updated":
        // Sync user data to Convex
        await ctx.db.insert("users", {
          name,
          email,
          role,
          companyId:
            ctx.db.normalizeId("companies", companyId || "") || undefined,
          clerkId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
        })
        break

      case "user.deleted": {
        // Soft delete user by setting isActive to false
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
          .first()

        if (existingUser) {
          await ctx.db.patch(existingUser._id, {
            isActive: false,
            updatedAt: Date.now(),
          })
        }
        break
      }
    }
  },
})
