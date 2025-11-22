import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface SearchResult {
  content: string;
  score: number;
  search_type: string;
  metadata: Record<string, unknown>;
}

interface FindMatchesRequest {
  job_description: string;
  k?: number;
  search_type?: "hybrid" | "vector" | "keyword";
}

interface FindMatchesResponse {
  results: SearchResult[];
  query: string;
  search_type: string;
  k: number;
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
            k: request.k || 5,
            search_type: request.search_type || "hybrid",
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
