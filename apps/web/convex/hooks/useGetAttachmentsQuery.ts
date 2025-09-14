import { api } from "@convex/_generated/api"
import { type Id } from "@convex/_generated/dataModel"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"

export const useGetAttachmentsQuery = (ids: Id<"attachments">[]) => {
  return useQuery(
    convexQuery(api.attachments.queryByIds, {
      ids,
    }),
  )
}
