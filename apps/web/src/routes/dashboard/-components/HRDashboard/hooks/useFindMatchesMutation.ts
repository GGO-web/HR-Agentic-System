import { useMutation } from "@tanstack/react-query";
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
  k?: number;
}

interface FindMatchesResponse {
  results: CandidateMatchResult[];
  query: string;
  total_candidates: number;
}

export const useFindMatchesMutation = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (
      request: FindMatchesRequest,
    ): Promise<FindMatchesResponse> => {
      const response = await fetch(
        `${API_URL}/api/v1/hybrid-search/find-matches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            job_description: request.job_description,
            k: request.k || 10,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
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
