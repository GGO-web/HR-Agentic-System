import { api } from "@convex/_generated/api";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export const useUpdateQuestionMutation = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: useConvexMutation(api.interviewQuestions.update),
    onSuccess: () => {
      toast.success(t("dashboard.questionsList.actions.update.success"));
    },
    onError: () => {
      toast.error(t("dashboard.questionsList.actions.update.error"));
    },
  });
};
