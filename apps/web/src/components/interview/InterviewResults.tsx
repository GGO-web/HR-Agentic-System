import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { Link, useRouter } from "@tanstack/react-router";
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner";
import { useQuery } from "convex/react";

interface InterviewResultsProps {
  sessionId: Id<"interviewSessions">;
}

export function InterviewResults({ sessionId }: InterviewResultsProps) {
  // Fetch interview session
  const session = useQuery(api.interviewSessions.getById, { id: sessionId });

  const router = useRouter();

  // Fetch job description
  const jobDescription = useQuery(
    api.jobDescriptions.getById,
    session ? { id: session.jobDescriptionId } : "skip",
  );

  // Fetch questions for the job description
  const questions = useQuery(
    api.interviewQuestions.getByJobDescription,
    session ? { jobDescriptionId: session.jobDescriptionId } : "skip",
  );

  // Fetch responses for the session
  const responses = useQuery(api.interviewResponses.getByInterviewSession, {
    interviewSessionId: sessionId,
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {jobDescription.title} Interview Results
          </h1>
          <p className="text-muted-foreground mt-2">
            Completed on{" "}
            {new Date(session.completedAt || 0).toLocaleDateString()}
          </p>
        </div>

        <Link
          to={router.routesByPath["/dashboard"].fullPath}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-6">
        {sortedQuestions.map((question, index) => {
          const response = findResponse(question._id);

          return (
            <div
              key={question._id}
              className="border-border bg-card rounded-lg border p-6 shadow-sm"
            >
              <h3 className="text-lg font-medium">Question {index + 1}</h3>
              <p className="mt-2">{question.question}</p>

              {response ? (
                <div className="mt-4">
                  <h4 className="mb-2 font-medium">Your Response</h4>

                  {/* Audio player */}
                  <div className="bg-muted mb-4 rounded-md p-4">
                    <audio
                      controls
                      src={response.audioUrl}
                      className="w-full"
                    />
                  </div>

                  {/* Transcription if available */}
                  {response.transcription && (
                    <div className="mb-4">
                      <h4 className="mb-2 font-medium">Transcription</h4>
                      <div className="bg-muted rounded-md p-4">
                        <p>{response.transcription}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis if available */}
                  {response.aiAnalysis && (
                    <div>
                      <h4 className="mb-2 font-medium">AI Analysis</h4>
                      <div className="bg-muted rounded-md p-4">
                        <p>{response.aiAnalysis}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted text-muted-foreground mt-4 rounded-md p-4 text-center">
                  No response recorded for this question.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
