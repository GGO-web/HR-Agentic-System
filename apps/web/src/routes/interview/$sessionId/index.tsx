import { type Id } from "@convex/_generated/dataModel"
import { createFileRoute } from "@tanstack/react-router"

import { InterviewFlow } from "@/components/interview/InterviewFlow"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export const Route = createFileRoute("/interview/$sessionId/")({
  component: InterviewPage,
})

function InterviewPage() {
  const { sessionId } = Route.useParams()

  return (
    <ProtectedRoute requireAuth requireCandidate>
      <InterviewFlow sessionId={sessionId as Id<"interviewSessions">} />
    </ProtectedRoute>
  )
}
