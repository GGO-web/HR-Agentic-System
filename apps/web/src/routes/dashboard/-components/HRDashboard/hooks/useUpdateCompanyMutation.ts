import { api } from "@convex/_generated/api";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const useUpdateCompanyMutation = () => {
  return useMutation({
    mutationFn: useConvexMutation(api.companies.update),
    onSuccess: () => {
      toast.success("Company information updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update company information. Please try again.");
    },
  });
};
