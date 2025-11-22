import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export const useApproveAllQuestionsMutation = () => {
  const { t } = useTranslation();
  const approveAll = useConvexMutation(api.interviewQuestions.approveAll);

  return {
    mutateAsync: async (jobDescriptionId: Id<"jobDescriptions">) => {
      await approveAll({ jobDescriptionId });
      toast.success(
        t("dashboard.hr.interviewQuestions.approveAll.success") ||
          "All questions approved successfully",
      );
    },
  };
};

