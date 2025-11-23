import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { Progress } from "@workspace/ui/components/progress";
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner";
import { useQuery as useConvexQuery } from "convex/react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getInterviewTranscriptFromS3 } from "@/services/s3Service";

interface InterviewResultsProps {
  sessionId: Id<"interviewSessions">;
}

export function InterviewResults({ sessionId }: InterviewResultsProps) {
  // Fetch interview session
  const session = useConvexQuery(api.interviewSessions.getById, {
    id: sessionId,
  });

  const { t } = useTranslation();

  const router = useRouter();

  // Fetch job description
  const jobDescription = useConvexQuery(
    api.jobDescriptions.getById,
    session ? { id: session.jobDescriptionId } : "skip",
  );

  // Fetch questions for the job description
  const questions = useConvexQuery(
    api.interviewQuestions.getByJobDescription,
    session ? { jobDescriptionId: session.jobDescriptionId } : "skip",
  );

  // Fetch responses for the session
  const responses = useConvexQuery(
    api.interviewResponses.getByInterviewSession,
    {
      interviewSessionId: sessionId,
    },
  );

  // Fetch transcript from S3 using React Query
  const { data: transcript, isLoading: isLoadingTranscript } = useQuery({
    queryKey: ["interviewTranscript", session?.transcriptUrl],
    queryFn: async () => {
      if (!session?.transcriptUrl) return null;
      const result = await getInterviewTranscriptFromS3(session.transcriptUrl);
      return result.success ? result.transcript : null;
    },
    enabled: !!session?.transcriptUrl,
  });

  // Loading state
  if (!session || !jobDescription || !questions || !responses) {
    return <LoadingSpinner fullScreen text="Loading results..." />;
  }

  // Sort questions by order
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  // Find response for a question (takes the one with highest finalScore if multiple exist)
  const findResponse = (questionId: string) => {
    const questionResponses = responses.filter(
      (response) => response.questionId === questionId,
    );
    if (questionResponses.length === 0) return undefined;

    // If multiple responses exist, return the one with highest finalScore
    return questionResponses.reduce((best, current) => {
      const bestScore = best.finalScore ?? 0;
      const currentScore = current.finalScore ?? 0;
      return currentScore > bestScore ? current : best;
    });
  };

  // Calculate overall statistics
  // Groups responses by questionId to avoid duplicates (takes the best score for each question)
  const calculateOverallStats = () => {
    // First, filter responses with scores
    const responsesWithScores = responses.filter(
      (r) => r.finalScore !== undefined && r.finalScore !== null,
    );

    if (responsesWithScores.length === 0) return null;

    // Group by questionId and take the response with the highest finalScore for each question
    // This handles cases where multiple responses exist for the same question (duplicates from analysis)
    const bestResponsesByQuestion = new Map<string, (typeof responses)[0]>();

    responsesWithScores.forEach((response) => {
      const questionId = response.questionId;
      const existing = bestResponsesByQuestion.get(questionId);

      // Take the response with the highest finalScore for each question
      if (
        !existing ||
        (response.finalScore || 0) > (existing.finalScore || 0)
      ) {
        bestResponsesByQuestion.set(questionId, response);
      }
    });

    const uniqueResponses = Array.from(bestResponsesByQuestion.values());

    if (uniqueResponses.length === 0) return null;

    const avgFinalScore =
      uniqueResponses.reduce((sum, r) => sum + (r.finalScore || 0), 0) /
      uniqueResponses.length;
    const avgContentScore =
      uniqueResponses.reduce((sum, r) => sum + (r.contentScore || 0), 0) /
      uniqueResponses.length;
    const avgConfidenceScore =
      uniqueResponses.reduce((sum, r) => sum + (r.confidenceScore || 0), 0) /
      uniqueResponses.length;

    return {
      avgFinalScore,
      avgContentScore,
      avgConfidenceScore,
      totalQuestions: uniqueResponses.length,
    };
  };

  const overallStats = calculateOverallStats();

  // Helper function to get score color
  const getScoreColor = (score: number | undefined | null) => {
    if (score === undefined || score === null) return "text-muted-foreground";
    if (score >= 0.7) return "text-green-600";
    if (score >= 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  // Extract candidate messages from transcript for a specific question
  const getCandidateAnswerForQuestion = (questionText: string) => {
    if (!transcript?.messages || !questionText) return null;

    // Find the agent message that contains this question
    let questionIndex = transcript.messages.findIndex(
      (msg) =>
        msg.source === "ai" &&
        msg.message
          .toLowerCase()
          .includes(questionText.toLowerCase().substring(0, 40)),
    );
    for (let i = 0; i < transcript.messages.length; i++) {
      const msg = transcript.messages[i];
      if (!msg) continue;

      if (
        (msg.source === "ai" || msg.source === "user") &&
        msg.message
          .toLowerCase()
          .includes(questionText.toLowerCase().substring(0, 40))
      ) {
        questionIndex = i;
        break;
      }
    }

    if (questionIndex === -1) return null;

    // Get the user message after this question until the next agent message
    const message = transcript.messages?.find(
      (value, index) => index > questionIndex && value.source === "user",
    )?.message;

    return message ?? null;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {jobDescription.title} Interview Results
          </h1>
          <div className="mt-2 flex items-center gap-4">
            <p className="text-muted-foreground">
              {t("interview.results.completed")}{" "}
              {new Date(session.submittedAt || 0).toLocaleDateString()}
            </p>
            {session.status === "in_review" && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                {t("interview.results.status.inReview")}
              </span>
            )}
            {session.status === "completed" && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                {t("interview.results.status.completed")}
              </span>
            )}
          </div>
        </div>

        <Link
          to={router.routesByPath["/dashboard"].fullPath}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
        >
          {t("interview.results.buttons.backToDashboard")}
        </Link>
      </div>

      {session.status === "in_review" && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center">
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
            <div>
              <h3 className="font-medium text-yellow-800">
                {t("interview.results.aiAnalysis.title")}
              </h3>
              <p className="text-sm text-yellow-700">
                {t("interview.results.aiAnalysis.progress")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Statistics */}
      {session.status === "completed" && overallStats && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="border-border bg-card rounded-lg border p-4">
            <div className="text-muted-foreground text-sm">
              {t("interview.results.overall.finalScore") || "Final Score"}
            </div>
            <div className="mt-2 text-2xl font-bold">
              <span className={getScoreColor(overallStats.avgFinalScore)}>
                {(overallStats.avgFinalScore * 100).toFixed(1)}%
              </span>
            </div>
            <Progress
              value={overallStats.avgFinalScore * 100}
              className="mt-2"
              indicatorClassName={
                overallStats.avgFinalScore >= 0.7
                  ? "bg-green-600"
                  : overallStats.avgFinalScore >= 0.4
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }
            />
          </div>
          <div className="border-border bg-card rounded-lg border p-4">
            <div className="text-muted-foreground text-sm">
              {t("interview.results.overall.contentScore") || "Content Score"}
            </div>
            <div className="mt-2 text-2xl font-bold">
              <span className={getScoreColor(overallStats.avgContentScore)}>
                {(overallStats.avgContentScore * 100).toFixed(1)}%
              </span>
            </div>
            <Progress
              value={overallStats.avgContentScore * 100}
              className="mt-2"
              indicatorClassName={
                overallStats.avgContentScore >= 0.7
                  ? "bg-green-600"
                  : overallStats.avgContentScore >= 0.4
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }
            />
          </div>
          <div className="border-border bg-card rounded-lg border p-4">
            <div className="text-muted-foreground text-sm">
              {t("interview.results.overall.confidenceScore") ||
                "Confidence Score"}
            </div>
            <div className="mt-2 text-2xl font-bold">
              <span className={getScoreColor(overallStats.avgConfidenceScore)}>
                {(overallStats.avgConfidenceScore * 100).toFixed(1)}%
              </span>
            </div>
            <Progress
              value={overallStats.avgConfidenceScore * 100}
              className="mt-2"
              indicatorClassName={
                overallStats.avgConfidenceScore >= 0.7
                  ? "bg-green-600"
                  : overallStats.avgConfidenceScore >= 0.4
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }
            />
          </div>
          <div className="border-border bg-card rounded-lg border p-4">
            <div className="text-muted-foreground text-sm">
              {t("interview.results.overall.questionsAnalyzed") ||
                "Questions Analyzed"}
            </div>
            <div className="mt-2 text-2xl font-bold">
              {overallStats.totalQuestions}
            </div>
            <div className="text-muted-foreground mt-2 text-sm">
              {t("interview.results.overall.outOf") || "out of"}{" "}
              {sortedQuestions.length}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {sortedQuestions.map((question, index) => {
          const response = findResponse(question._id);

          const candidateAnswer = getCandidateAnswerForQuestion(
            question.question,
          );

          if (!response || !candidateAnswer) {
            return null;
          }

          return (
            <div
              key={question._id}
              className="border-border bg-card rounded-lg border p-6 shadow-sm"
            >
              <h3 className="text-lg font-medium">
                {t("interview.results.question", { index: index + 1 })}
              </h3>
              <p className="mt-2">{question.question}</p>

              <div className="my-4">
                <h4 className="mb-2 font-medium">
                  {t("interview.results.yourAnswer")}
                </h4>
                <div className="bg-muted rounded-md p-4">
                  {isLoadingTranscript ? (
                    <LoadingSpinner text="Loading transcription..." />
                  ) : (
                    <div className="space-y-2">
                      <p>
                        {response.transcription ||
                          candidateAnswer ||
                          t("interview.results.noAnswer")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Scores */}
              {session.status === "completed" && (
                <div className="mt-6 space-y-4 border-t pt-4">
                  <h4 className="font-medium">
                    {t("interview.results.analysisScores") || "Analysis Scores"}
                  </h4>

                  {/* Final Score */}
                  {response.finalScore !== undefined &&
                    response.finalScore !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {t("interview.results.scores.finalScore") ||
                                "Final Score"}
                            </span>
                            {response.finalScore >= 0.7 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : response.finalScore >= 0.4 ? (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <span
                            className={`text-lg font-bold ${getScoreColor(response.finalScore)}`}
                          >
                            {(response.finalScore * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={response.finalScore * 100}
                          indicatorClassName={
                            response.finalScore >= 0.7
                              ? "bg-green-600"
                              : response.finalScore >= 0.4
                                ? "bg-yellow-600"
                                : "bg-red-600"
                          }
                        />
                      </div>
                    )}

                  {/* Content Score */}
                  {response.contentScore !== undefined &&
                    response.contentScore !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {t("interview.results.scores.contentScore") ||
                              "Content Validity"}
                          </span>
                          <span
                            className={`text-sm font-semibold ${getScoreColor(response.contentScore)}`}
                          >
                            {(response.contentScore * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={response.contentScore * 100}
                          className="h-2"
                          indicatorClassName={
                            response.contentScore >= 0.7
                              ? "bg-green-500"
                              : response.contentScore >= 0.4
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }
                        />
                        <p className="text-muted-foreground text-xs">
                          {t("interview.results.scores.contentDescription") ||
                            "Measures how well the answer matches expected keywords and content"}
                        </p>
                      </div>
                    )}

                  {/* Confidence Score */}
                  {response.confidenceScore !== undefined &&
                    response.confidenceScore !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {t("interview.results.scores.confidenceScore") ||
                              "Confidence Level"}
                          </span>
                          <span
                            className={`text-sm font-semibold ${getScoreColor(response.confidenceScore)}`}
                          >
                            {(response.confidenceScore * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={response.confidenceScore * 100}
                          className="h-2"
                          indicatorClassName={
                            response.confidenceScore >= 0.7
                              ? "bg-green-500"
                              : response.confidenceScore >= 0.4
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }
                        />
                        <p className="text-muted-foreground text-xs">
                          {t(
                            "interview.results.scores.confidenceDescription",
                          ) ||
                            "Measures speech patterns, pace, and linguistic confidence indicators"}
                        </p>
                      </div>
                    )}

                  {/* No scores available */}
                  {response.finalScore === undefined &&
                    response.contentScore === undefined &&
                    response.confidenceScore === undefined && (
                      <div className="text-muted-foreground text-sm">
                        {t("interview.results.scores.notAvailable") ||
                          "Analysis scores are not available yet"}
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
