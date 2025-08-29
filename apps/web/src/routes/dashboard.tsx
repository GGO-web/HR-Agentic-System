import { createFileRoute } from "@tanstack/react-router"

import { CandidateDashboard } from "../components/dashboard/CandidateDashboard"
import { HRDashboard } from "../components/dashboard/HRDashboard"
import { ProtectedRoute } from "../components/ProtectedRoute"
import { useAuth } from "../hooks/useAuth"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const { isHRManager, isCandidate, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <ProtectedRoute requireAuth>
      {isHRManager && <HRDashboard />}

      {isCandidate && <CandidateDashboard />}
    </ProtectedRoute>
  )
}
