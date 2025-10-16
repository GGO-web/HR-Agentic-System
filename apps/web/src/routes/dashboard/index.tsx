import { createFileRoute } from "@tanstack/react-router";
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner";

import { useAuth } from "../../hooks/useAuth";
import { RoleProtectedRoute } from "../sign-up/-components/RoleProtectedRoute";

import { CandidateDashboard } from "./-components/CandidateDashboard/CandidateDashboard";
import { HRDashboard } from "./-components/HRDashboard/HRDashboard";

import { UserRole } from "@/types/userRole";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { isHRManager, isCandidate, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <RoleProtectedRoute
      requireAuth
      allowedRoles={[UserRole.HR_MANAGER, UserRole.CANDIDATE]}
    >
      {isHRManager && <HRDashboard />}
      {isCandidate && <CandidateDashboard />}
    </RoleProtectedRoute>
  );
}
