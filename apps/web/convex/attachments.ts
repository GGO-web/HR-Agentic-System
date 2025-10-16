import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    files: v.array(
      v.object({
        name: v.string(),
        type: v.string(),
        size: v.number(),
        url: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const attachments = await Promise.all(
      args.files.map(async (file) => {
        const attachment = {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: file.url,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const attachmentId = await ctx.db.insert("attachments", attachment);

        return { ...attachment, _id: attachmentId };
      }),
    );

    return attachments;
  },
});

export const queryByIds = query({
  args: { ids: v.array(v.id("attachments")) },
  handler: async (ctx, args) => {
    const docs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return docs.filter(Boolean);
  },
});
