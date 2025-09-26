import { api } from "@convex/_generated/api"
import { useConvexMutation } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"

export const useCreateInvitationMutation = () => {
  return useMutation({
    mutationFn: useConvexMutation(api.interviewInvitations.create),
    onError: (error) => {
      console.error("Error creating invitation:", error)
    },
  })
}
