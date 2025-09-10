import { api } from "@convex/_generated/api"
import { type Id } from "@convex/_generated/dataModel"
import { useConvexMutation } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"

export const useDeleteJobDescriptionMutation = (
  jobDescriptionId: Id<"jobDescriptions">,
) => {
  const deleteJobQuestions = useConvexMutation(
    api.interviewQuestions.deleteByJobDescription,
  )
  return useMutation({
    mutationFn: useConvexMutation(api.jobDescriptions.remove),
    onSuccess: async () => {
      await deleteJobQuestions({ jobDescriptionId })
      toast.success("Job description deleted successfully!")
    },
    onError: () => {
      toast.error("Failed to delete job description. Please try again.")
    },
  })
}
