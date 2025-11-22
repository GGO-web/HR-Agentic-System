import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export const useApproveQuestionMutation = () => {
  const { t } = useTranslation();
  const approveQuestion = useConvexMutation(api.interviewQuestions.approve);

  return {
    mutateAsync: async (id: Id<"interviewQuestions">) => {
      await approveQuestion({ id });
      toast.success(
        t("dashboard.hr.interviewQuestions.approve.success") ||
          "Question approved successfully",
      );
    },
  };
};

