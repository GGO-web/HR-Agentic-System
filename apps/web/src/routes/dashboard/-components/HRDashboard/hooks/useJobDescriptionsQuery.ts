import { api } from "@convex/_generated/api"
import { type Doc } from "@convex/_generated/dataModel"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"

export const useJobDescriptionsQuery = (
  companyData: Doc<"companies"> | null,
) => {
  return useQuery(
    convexQuery(
      api.jobDescriptions.getByCompany,
      companyData ? { companyId: companyData._id } : "skip",
    ),
  )
}
