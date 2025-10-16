import { api } from "@convex/_generated/api";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export const useCreateJobDescriptionMutation = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: useConvexMutation(api.jobDescriptions.create),
    onSuccess: () => {
      toast.success(t("dashboard.hr.jobDescriptions.actions.create.success"));
    },
    onError: () => {
      toast.error(t("dashboard.hr.jobDescriptions.actions.create.error"));
    },
  });
};
