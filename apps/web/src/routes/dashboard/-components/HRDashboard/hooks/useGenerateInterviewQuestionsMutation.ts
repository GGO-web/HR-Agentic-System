import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const useGenerateInterviewQuestionsMutation = () => {
  const { t } = useTranslation();

  const createQuestion = useConvexMutation(api.interviewQuestions.create);

  return useMutation({
    mutationFn: async ({
      jobDescriptionId,
      title,
      description,
      temperature = 0.7,
      regenerate = false,
    }: {
      jobDescriptionId: Id<"jobDescriptions">;
      title: string;
      description: string;
      temperature?: number;
      regenerate?: boolean;
    }) => {
      // 1. Call the API directly from the frontend
      const response = await fetch(`${API_URL}/api/v1/questions/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          temperature,
          regenerate,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const aiQuestions = data.questions; // Array of Question objects with question_text, category, difficulty, expected_keywords

      // 2. Save each question to Convex with status "pending"
      const questionIds = await Promise.all(
        aiQuestions.map((q: any, index: number) =>
          createQuestion({
            jobDescriptionId,
            question: q.question_text || q.question || "", // Legacy field
            question_text: q.question_text || q.question || "",
            category: q.category,
            difficulty: q.difficulty || undefined, // Only include if not null/empty
            expected_keywords: q.expected_keywords || [],
            order: q.order || index + 1,
            isAIGenerated: true,
            status: "pending", // All questions start as pending (Human-in-the-loop)
          }),
        ),
      );

      return questionIds;
    },
    onSuccess: () => {
      toast.success(
        t("dashboard.hr.interviewQuestions.generateAIQuestions.success"),
      );
    },
    onError: (error) => {
      console.error("Error generating questions:", error);
      toast.error(
        t("dashboard.hr.interviewQuestions.generateAIQuestions.error"),
      );
    },
  });
};
