import { api } from "@convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";

export const useGetInvitationByTokenQuery = (token: string) => {
  return useQuery(
    convexQuery(api.interviewInvitations.getByToken, {
      token,
    }),
  );
};
