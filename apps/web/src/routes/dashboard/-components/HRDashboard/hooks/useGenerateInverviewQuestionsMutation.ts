import { api } from "@convex/_generated/api";
import { useConvexAction } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export const useGenerateInverviewQuestionsMutation = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: useConvexAction(
      api.interviewQuestions.actionGenerateAndSaveAIQuestions,
    ),
    onSuccess: () => {
      toast.success(
        t("dashboard.hr.interviewQuestions.generateAIQuestions.success"),
      );
    },
    onError: () => {
      toast.error(
        t("dashboard.hr.interviewQuestions.generateAIQuestions.error"),
      );
    },
  });
};
