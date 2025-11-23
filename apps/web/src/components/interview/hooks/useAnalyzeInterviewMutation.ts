import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface AnalyzeInterviewRequest {
  conversationId: string;
  interviewSessionId: Id<"interviewSessions">;
  questions: Array<{
    _id: Id<"interviewQuestions">;
    question_text?: string;
    question?: string;
    order: number;
    expected_keywords?: string[];
  }>;
}

interface AnalysisResult {
  question_id: string;
  audio_url: string;
  transcription: string;
  content_score: number;
  confidence_score: number;
  final_score: number;
  error?: string;
}

interface AnalysisResponse {
  status: "success" | "error" | "warning";
  conversation_id: string;
  qa_pairs_analyzed: number;
  successful_analyses: number;
  failed_analyses: number;
  results: AnalysisResult[];
  error?: string;
}

export const useAnalyzeInterviewMutation = () => {
  const { t } = useTranslation();
  const createResponseWithAnalysis = useConvexMutation(
    api.interviewResponses.createWithAnalysis,
  );
  const completeSession = useConvexMutation(
    api.interviewSessions.sessionComplete,
  );

  return useMutation({
    mutationFn: async (request: AnalyzeInterviewRequest) => {
      // Call analysis API
      const response = await fetch(`${API_URL}/api/v1/interviews/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: request.conversationId,
          questions: request.questions.map((q) => ({
            question_id: q._id,
            question_text: q.question_text || q.question,
            order: q.order,
            expected_keywords: q.expected_keywords || [],
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Analysis failed: ${errorText}`);
      }

      const analysisResults: AnalysisResponse = await response.json();

      if (analysisResults.status !== "success" || !analysisResults.results) {
        throw new Error(
          analysisResults.error || "Analysis returned error status",
        );
      }

      // Store analysis results in Convex
      for (const result of analysisResults.results) {
        if (result.error) {
          console.error(
            `Error analyzing question ${result.question_id}:`,
            result.error,
          );
          continue;
        }

        // Create response with analysis results
        await createResponseWithAnalysis({
          interviewSessionId: request.interviewSessionId,
          questionId: result.question_id as Id<"interviewQuestions">,
          audioUrl: result.audio_url,
          transcription: result.transcription,
          contentScore: result.content_score,
          confidenceScore: result.confidence_score,
          finalScore: result.final_score,
        });
      }

      // Update session status to completed after successful analysis
      await completeSession({
        id: request.interviewSessionId,
      });

      return analysisResults;
    },
    onSuccess: () => {
      toast.success(
        t("interview.analysis.completed") || "Analysis completed successfully",
      );
    },
    onError: (error) => {
      console.error("Analysis error:", error);
      toast.error(
        t("interview.analysis.failed") ||
          "Analysis failed, but interview saved",
      );
    },
  });
};
