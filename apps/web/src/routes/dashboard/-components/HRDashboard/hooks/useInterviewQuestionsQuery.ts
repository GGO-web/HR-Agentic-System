import { api } from "@convex/_generated/api"
import { type Id } from "@convex/_generated/dataModel"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"

export const useInterviewQuestionsQuery = (
  jobDescriptionId: Id<"jobDescriptions"> | null,
) => {
  return useQuery(
    convexQuery(
      api.interviewQuestions.getByJobDescription,
      jobDescriptionId ? { jobDescriptionId } : "skip",
    ),
  )
}
