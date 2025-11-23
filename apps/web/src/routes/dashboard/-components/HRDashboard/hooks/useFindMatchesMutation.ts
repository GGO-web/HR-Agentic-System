import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface ScoreReasoning {
  technical_skills: string;
  experience: string;
  overall_match: string;
}

export interface HybridScores {
  vector_score: number;
  bm25_score: number;
  hybrid_score: number;
}

export interface CandidateAnalysisReport {
  fit_category: string;
  overall_score: number;
  missing_skills: string[];
  explanation: string;
  strengths: string[];
  weaknesses: string[];
}

export interface CandidateMatchResult {
  candidate_id: string;
  scores: HybridScores;
  report?: CandidateAnalysisReport;
}

interface FindMatchesRequest {
  job_description: string;
  jobDescriptionId?: Id<"jobDescriptions">;
  job_description_id?: string; // For backend to save results
  k?: number;
}

interface FindMatchesResponse {
  results: CandidateMatchResult[];
  query: string;
  total_candidates: number;
}

export const useFindMatchesMutation = () => {
  const { t } = useTranslation();
  const saveEvaluation = useConvexMutation(
    api.resumeEvaluations.createOrUpdate,
  );

  return useMutation({
    mutationFn: async (
      request: FindMatchesRequest,
    ): Promise<FindMatchesResponse> => {
      // Call API to get results
      const response = await fetch(
        `${API_URL}/api/v1/hybrid-search/find-matches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            job_description: request.job_description,
            job_description_id: request.jobDescriptionId, // Pass to backend for saving
            k: request.k || 10,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: FindMatchesResponse = await response.json();

      // Results are already saved by backend if jobDescriptionId was provided
      // But we can also save on frontend as backup
      if (request.jobDescriptionId) {
        try {
          await saveEvaluation({
            jobDescriptionId: request.jobDescriptionId,
            jobDescriptionText: request.job_description,
            results: data.results.map((result) => ({
              candidate_id: result.candidate_id,
              scores: result.scores,
              report: result.report,
            })),
            totalCandidates: data.total_candidates,
          });
        } catch (saveError) {
          console.error("Failed to save evaluation results (frontend backup):", saveError);
          // Don't throw - results are still valid even if save fails
        }
      }

      return data;
    },
    onSuccess: () => {
      toast.success(
        t("dashboard.hr.resumeMatching.findMatches.actions.success"),
      );
    },
    onError: (error) => {
      console.error("Error finding matches:", error);
      toast.error(t("dashboard.hr.resumeMatching.findMatches.actions.error"));
    },
  });
};
