import { createFileRoute } from "@tanstack/react-router"

import { RoleProtectedRoute } from "../components/auth/RoleProtectedRoute"
import { CandidateDashboard } from "../components/dashboard/CandidateDashboard"
import { HRDashboard } from "../components/dashboard/HRDashboard"
import { useAuth } from "../hooks/useAuth"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const { isHRManager, isCandidate, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <RoleProtectedRoute requireAuth allowedRoles={["hr_manager", "candidate"]}>
      {isHRManager && <HRDashboard />}
      {isCandidate && <CandidateDashboard />}
    </RoleProtectedRoute>
  )
}
