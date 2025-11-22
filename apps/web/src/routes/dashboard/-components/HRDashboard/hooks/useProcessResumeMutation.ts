import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ProcessResumeResponse {
  message: string;
  document_count: number;
  filename: string;
}

export const useProcessResumeMutation = () => {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      file,
      candidateId,
    }: {
      file: File;
      candidateId?: string;
    }): Promise<ProcessResumeResponse> => {
      const formData = new FormData();
      formData.append("file", file);
      if (candidateId) {
        formData.append("candidate_id", candidateId);
      }

      const response = await fetch(
        `${API_URL}/api/v1/hybrid-search/process-resume`,
        {
          method: "POST",
          body: formData,
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
      console.error("Error processing resume:", error);
      // Error message is handled by the calling component
    },
  });
};

