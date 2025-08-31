import { createFileRoute } from "@tanstack/react-router"
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner"

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
    return <LoadingSpinner fullScreen text="Loading..." />
  }

  return (
    <RoleProtectedRoute requireAuth allowedRoles={["hr_manager", "candidate"]}>
      {isHRManager && <HRDashboard />}
      {isCandidate && <CandidateDashboard />}
    </RoleProtectedRoute>
  )
}
