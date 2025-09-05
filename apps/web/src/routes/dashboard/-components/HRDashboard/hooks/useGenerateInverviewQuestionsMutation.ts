import { api } from "@convex/_generated/api"
import { useConvexMutation } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"

export const useGenerateInverviewQuestionsMutation = () => {
  return useMutation({
    mutationFn: useConvexMutation(api.interviewQuestions.generateAIQuestions),
  })
}
