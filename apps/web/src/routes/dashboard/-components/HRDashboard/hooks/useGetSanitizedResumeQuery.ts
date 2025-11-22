import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface SanitizedResumeResponse {
  candidate_id: string;
  sanitized_content: string;
  filename?: string;
}

export const useGetSanitizedResumeQuery = (candidateId: string | null) => {
  return useQuery<SanitizedResumeResponse>({
    queryKey: ["sanitized-resume", candidateId],
    queryFn: async () => {
      if (!candidateId) {
        throw new Error("Candidate ID is required");
      }

      // Ensure candidateId is a string
      const candidateIdStr = String(candidateId);

      const response = await fetch(
        `${API_URL}/api/v1/hybrid-search/sanitized-resume/${encodeURIComponent(candidateIdStr)}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    },
    enabled: !!candidateId,
  });
};
