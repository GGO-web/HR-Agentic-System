import { type Id } from "@convex/_generated/dataModel"
import { createFileRoute } from "@tanstack/react-router"

import { InterviewResults } from "@/components/interview/InterviewResults"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export const Route = createFileRoute("/interview/$sessionId/results")({
  component: InterviewResultsPage,
})

function InterviewResultsPage() {
  const { sessionId } = Route.useParams()

  return (
    <ProtectedRoute requireAuth>
      <InterviewResults sessionId={sessionId as Id<"interviewSessions">} />
    </ProtectedRoute>
  )
}
