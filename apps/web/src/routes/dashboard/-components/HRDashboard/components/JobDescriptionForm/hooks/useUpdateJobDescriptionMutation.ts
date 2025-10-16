import { api } from "@convex/_generated/api";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export const useUpdateJobDescriptionMutation = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: useConvexMutation(api.jobDescriptions.update),
    onError: () => {
      toast.error(t("dashboard.hr.jobDescriptions.actions.edit.error"));
    },
  });
};
