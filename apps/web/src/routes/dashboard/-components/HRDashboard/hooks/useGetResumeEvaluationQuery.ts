import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useConvexQuery } from "@convex-dev/react-query";

import type { CandidateMatchResult } from "./useFindMatchesMutation";

/**
 * Hook to get cached resume evaluation results for a job description.
 * Returns null if no cached results exist.
 */
export const useGetResumeEvaluationQuery = (
  jobDescriptionId: Id<"jobDescriptions"> | undefined,
  jobDescriptionText: string,
) => {
  const evaluation = useConvexQuery(
    api.resumeEvaluations.getByJobDescription,
    jobDescriptionId && jobDescriptionText
      ? {
          jobDescriptionId,
          jobDescriptionText,
        }
      : "skip",
  );

  if (!evaluation) {
    return {
      data: null,
      isLoading: false,
    };
  }

  return {
    data: {
      results: evaluation.results as CandidateMatchResult[],
      query: jobDescriptionText,
      total_candidates: evaluation.totalCandidates,
    },
    isLoading: false,
  };
};

