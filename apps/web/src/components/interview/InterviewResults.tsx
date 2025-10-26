import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner";
import { useQuery as useConvexQuery } from "convex/react";

import { getInterviewTranscriptFromS3 } from "@/services/s3Service";

interface InterviewResultsProps {
  sessionId: Id<"interviewSessions">;
}

export function InterviewResults({ sessionId }: InterviewResultsProps) {
  // Fetch interview session
  const session = useConvexQuery(api.interviewSessions.getById, {
    id: sessionId,
  });

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

  // Find response for a question
  const findResponse = (questionId: string) => {
    return responses.find((response) => response.questionId === questionId);
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
              Completed on{" "}
              {new Date(session.completedAt || 0).toLocaleDateString()}
            </p>
            {session.status === "in_review" && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                In Review
              </span>
            )}
            {session.status === "completed" && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                Completed
              </span>
            )}
          </div>
        </div>

        <Link
          to={router.routesByPath["/dashboard"].fullPath}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
        >
          Back to Dashboard
        </Link>
      </div>

      {session.status === "in_review" && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center">
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
            <div>
              <h3 className="font-medium text-yellow-800">
                AI Analysis in Progress
              </h3>
              <p className="text-sm text-yellow-700">
                Your interview responses are being analyzed by our AI system.
                Detailed feedback and analysis will be available once the review
                is complete.
              </p>
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
              <h3 className="text-lg font-medium">Question {index + 1}</h3>
              <p className="mt-2">{question.question}</p>

              <div className="my-4">
                <h4 className="mb-2 font-medium">Your Answer:</h4>
                <div className="bg-muted rounded-md p-4">
                  {isLoadingTranscript ? (
                    <LoadingSpinner text="Loading transcription..." />
                  ) : (
                    <div className="space-y-2">
                      <p>{candidateAnswer}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
