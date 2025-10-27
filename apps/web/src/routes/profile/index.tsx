import { createFileRoute } from "@tanstack/react-router";
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner";

import { useAuth } from "../../hooks/useAuth";
import { CandidateProfile } from "../dashboard/-components/CandidateDashboard/components/CandidateProfile/CandidateProfile";

export const Route = createFileRoute("/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { userData, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!userData) {
    return null;
  }

  return <CandidateProfile userId={userData._id} />;
}
