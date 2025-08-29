import { api } from "@convex/_generated/api"
import { type Id } from "@convex/_generated/dataModel"
import { useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation } from "convex/react"
import { useState, useEffect } from "react"

import { AudioRecorder } from "./AudioRecorder"
import { QuestionDisplay } from "./QuestionDisplay"

interface InterviewFlowProps {
  sessionId: Id<"interviewSessions">
}

export function InterviewFlow({ sessionId }: InterviewFlowProps) {
  const navigate = useNavigate()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch interview session
  const session = useQuery(api.interviewSessions.getById, { id: sessionId })

  // Fetch job description
  const jobDescription = useQuery(
    api.jobDescriptions.getById,
    session ? { id: session.jobDescriptionId } : "skip",
  )

  // Fetch questions for the job description
  const questions = useQuery(
    api.interviewQuestions.getByJobDescription,
    session ? { jobDescriptionId: session.jobDescriptionId } : "skip",
  )

  // Mutations
  const startSession = useMutation(api.interviewSessions.startSession)
  const completeSession = useMutation(api.interviewSessions.completeSession)
  const createResponse = useMutation(api.interviewResponses.create)

  // Start the session if it's not already started
  useEffect(() => {
    if (session && session.status === "scheduled") {
      void startSession({ id: sessionId })
    }
  }, [session, sessionId, startSession])

  // Sort questions by order
  const sortedQuestions = questions
    ? [...questions].sort((a, b) => a.order - b.order)
    : []

  // Current question
  const currentQuestion = sortedQuestions[currentQuestionIndex]

  // Handle recording complete
  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob)
    setIsRecording(false)
  }

  // Handle submitting the response
  const handleSubmitResponse = async () => {
    if (!audioBlob || !currentQuestion) return

    setIsSubmitting(true)

    try {
      // TODO: Implement actual audio upload to cloud storage
      // For now, we'll just use a placeholder URL
      const audioUrl = `mock-audio-url-${Date.now()}`

      await createResponse({
        interviewSessionId: sessionId,
        questionId: currentQuestion._id,
        audioUrl,
        transcription: undefined, // Will be processed asynchronously
        aiAnalysis: undefined, // Will be processed asynchronously
      })

      // Move to next question or complete the interview
      if (currentQuestionIndex < sortedQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        await completeSession({ id: sessionId })
        await navigate({ to: "/dashboard" })
      }

      // Reset audio blob
      setAudioBlob(null)
    } catch (error) {
      console.error("Failed to submit response:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (!session || !jobDescription || !questions) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / sortedQuestions.length) * 100

  return (
    <div className="container mx-auto flex min-h-screen flex-col p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{jobDescription.title} Interview</h1>
        <div className="bg-muted mt-4 h-2 w-full rounded-full">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-muted-foreground mt-2 flex justify-between text-sm">
          <span>
            Question {currentQuestionIndex + 1} of {sortedQuestions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      {currentQuestion && (
        <div className="flex-1">
          <QuestionDisplay
            question={currentQuestion.question}
            questionNumber={currentQuestionIndex + 1}
          />

          <div className="mt-8">
            {!audioBlob ? (
              <AudioRecorder
                isRecording={isRecording}
                onStartRecording={() => setIsRecording(true)}
                onStopRecording={() => setIsRecording(false)}
                onRecordingComplete={handleRecordingComplete}
              />
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-muted mb-4 rounded-lg p-4">
                  <p className="text-center">Recording complete!</p>
                  <audio
                    className="mt-2 w-full"
                    controls
                    src={URL.createObjectURL(audioBlob)}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setAudioBlob(null)}
                    className="border-input bg-background rounded-md border px-4 py-2"
                    disabled={isSubmitting}
                  >
                    Record Again
                  </button>
                  <button
                    onClick={handleSubmitResponse}
                    className="bg-primary text-primary-foreground rounded-md px-4 py-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
