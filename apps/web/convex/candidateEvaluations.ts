import { v } from "convex/values";

import { query } from "./_generated/server";

// Get all candidate evaluations for a job description
export const getByJobDescription = query({
  args: {
    jobDescriptionId: v.id("jobDescriptions"),
  },
  handler: async (ctx, args) => {
    // Get all interview sessions for this job description
    const sessions = await ctx.db
      .query("interviewSessions")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .collect();

    // Get job description for resume evaluation lookup
    const jobDescription = await ctx.db.get(args.jobDescriptionId);
    if (!jobDescription) {
      return [];
    }

    // Get resume evaluation for this job description
    const resumeEvaluation = await ctx.db
      .query("resumeEvaluations")
      .withIndex("by_job_description", (q) =>
        q.eq("jobDescriptionId", args.jobDescriptionId),
      )
      .first();

    // Process each session
    const evaluations = await Promise.all(
      sessions.map(async (session) => {
        // Get candidate user
        const candidate = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", session.candidateEmail))
          .first();

        // Get all responses for this session
        const responses = await ctx.db
          .query("interviewResponses")
          .withIndex("by_interview_session", (q) =>
            q.eq("interviewSessionId", session._id),
          )
          .collect();

        // Get questions for this job to calculate weighted scores
        const questions = await ctx.db
          .query("interviewQuestions")
          .withIndex("by_job_description", (q) =>
            q.eq("jobDescriptionId", args.jobDescriptionId),
          )
          .collect();

        // Calculate complexity weight based on category
        const getComplexityWeight = (category: string | undefined): number => {
          if (category === "intro" || category === "motivation") {
            return 1;
          }
          if (category === "challenge" || category === "vision") {
            return 3;
          }
          return 2;
        };

        // Group responses by questionId (take best score for each question)
        const bestResponsesByQuestion = new Map<
          string,
          (typeof responses)[0]
        >();

        responses.forEach((response) => {
          if (
            response.finalScore !== undefined &&
            response.finalScore !== null
          ) {
            const questionId = response.questionId;
            const existing = bestResponsesByQuestion.get(questionId);

            if (
              !existing ||
              (response.finalScore || 0) > (existing.finalScore || 0)
            ) {
              bestResponsesByQuestion.set(questionId, response);
            }
          }
        });

        const uniqueResponses = Array.from(bestResponsesByQuestion.values());

        // Calculate weighted scores
        let weightedFinalSum = 0;
        let weightedContentSum = 0;
        let weightedConfidenceSum = 0;
        let totalWeight = 0;

        uniqueResponses.forEach((response) => {
          const question = questions.find((q) => q._id === response.questionId);
          const weight = getComplexityWeight(question?.category);
          const finalScore = response.finalScore || 0;
          const contentScore = response.contentScore || 0;
          const confidenceScore = response.confidenceScore || 0;

          weightedFinalSum += finalScore * weight;
          weightedContentSum += contentScore * weight;
          weightedConfidenceSum += confidenceScore * weight;
          totalWeight += weight;
        });

        const weightedFinalScore =
          totalWeight > 0 ? weightedFinalSum / totalWeight : 0;
        const weightedContentScore =
          totalWeight > 0 ? weightedContentSum / totalWeight : 0;
        const weightedConfidenceScore =
          totalWeight > 0 ? weightedConfidenceSum / totalWeight : 0;

        // Get resume score
        let resumeScore: number | null = null;
        if (resumeEvaluation && candidate) {
          const candidateResult = resumeEvaluation.results.find(
            (r) => r.candidate_id === candidate._id,
          );
          if (candidateResult?.report) {
            resumeScore = candidateResult.report.overall_score / 100;
          }
        }

        // Calculate integrated score
        const integratedScore =
          resumeScore !== null
            ? resumeScore * 0.3 + weightedFinalScore * 0.7
            : weightedFinalScore;

        // Classify candidate
        let category: "strong_hire" | "potential" | "rejected";
        if (integratedScore >= 0.85) {
          category = "strong_hire";
        } else if (integratedScore >= 0.6) {
          category = "potential";
        } else {
          category = "rejected";
        }

        return {
          sessionId: session._id,
          candidateEmail: session.candidateEmail,
          candidateName: candidate?.name || session.candidateEmail.split("@")[0],
          candidateId: candidate?._id,
          resumeScore,
          interviewScore: weightedFinalScore,
          contentScore: weightedContentScore,
          confidenceScore: weightedConfidenceScore,
          integratedScore,
          category,
          status: session.status,
          completedAt: session.completedAt,
          questionsAnswered: uniqueResponses.length,
          totalQuestions: questions.length,
        };
      }),
    );

    // Filter only completed sessions
    return evaluations.filter((e) => e.status === "completed");
  },
});

