import { api } from "@convex/_generated/api"
import { useConvexMutation } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"

export const useAcceptInvitationMutation = () => {
  return useMutation({
    mutationFn: useConvexMutation(api.interviewInvitations.accept),
    onError: (error) => {
      console.error("Error accepting invitation:", error)
    },
  })
}
