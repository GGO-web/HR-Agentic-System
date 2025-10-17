import { useTranslation } from "react-i18next";

import { InvitedJobDescriptions } from "./components/InvitedJobDescriptions/InvitedJobDescriptions";

export function CandidateDashboard() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-2xl font-bold md:text-3xl">
        {t("dashboard.candidate.title")}
      </h1>

      {/* Invited Job Descriptions Section */}
      <InvitedJobDescriptions />
    </div>
  );
}
