import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface DeleteResumeResponse {
  message: string;
  deleted_count: number;
  candidate_id: string;
}

export const useDeleteResumeMutation = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (candidateId: string): Promise<DeleteResumeResponse> => {
      const response = await fetch(
        `${API_URL}/api/v1/hybrid-search/resume/${encodeURIComponent(candidateId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Success message is handled by the calling component
    },
    onError: (error) => {
      console.error("Error deleting resume from ChromaDB:", error);
      // Error message is handled by the calling component
    },
  });
};

