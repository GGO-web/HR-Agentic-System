import { api } from "@convex/_generated/api";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";

export const useDeclineInvitationMutation = () => {
  return useMutation({
    mutationFn: useConvexMutation(api.interviewInvitations.decline),
    onError: (error) => {
      console.error("Error declining invitation:", error);
    },
  });
};
