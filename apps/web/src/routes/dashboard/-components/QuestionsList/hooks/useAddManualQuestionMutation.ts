import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export const useAddManualQuestionMutation = () => {
  const { t } = useTranslation();
  const createQuestion = useConvexMutation(api.interviewQuestions.create);

  return {
    mutateAsync: async ({
      jobDescriptionId,
      question_text,
      category = "custom",
      maxOrder = 0,
    }: {
      jobDescriptionId: Id<"jobDescriptions">;
      question_text: string;
      category?: string;
      maxOrder?: number;
    }) => {
      await createQuestion({
        jobDescriptionId,
        question: question_text,
        question_text,
        category,
        order: maxOrder + 1, // Place after existing questions
        isAIGenerated: false,
        status: "pending",
      });

      toast.success(
        t("dashboard.hr.interviewQuestions.addManual.success") ||
          "Manual question added successfully",
      );
    },
  };
};

