import { type Id } from "@convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { QuestionsList } from "../QuestionsList/QuestionsList";

import { CompanyProfile } from "./components/CompanyProfile/CompanyProfile";
import { CompanyProfileForm } from "./components/CompanyProfile/components/CompanyProfileForm/CompanyProfileForm";
import { useJobDescriptionsQuery } from "./components/JobDescriptionForm/hooks/useJobDescriptionsQuery";
import { JobDescriptionForm } from "./components/JobDescriptionForm/JobDescriptionForm";
import { JobDescriptionList } from "./components/JobDescriptionList/JobDescriptionList";
import { useGenerateInterviewQuestionsMutation } from "./hooks/useGenerateInterviewQuestionsMutation";
import { useInterviewQuestionsQuery } from "./hooks/useInterviewQuestionsQuery";
import { ResumeMatchSearch } from "./components/ResumeMatchSearch/ResumeMatchSearch";

import { useAuth } from "@/hooks/useAuth";

export function HRDashboard() {
  const { userData, companyData } = useAuth();
  const [selectedJobId, setSelectedJobId] =
    useState<Id<"jobDescriptions"> | null>(null);
  const [isCompanyProfileFormOpen, setIsCompanyProfileFormOpen] =
    useState(false);
  const { t } = useTranslation();

  // Fetch job descriptions for the company
  const { data: jobDescriptions } = useJobDescriptionsQuery(
    companyData ?? null,
  );

  // Fetch questions for the selected job
  const { data: questions } = useInterviewQuestionsQuery(selectedJobId ?? null);

  // Generate AI questions mutation
  const { mutateAsync: generateQuestions, isPending: isGeneratingQuestions } =
    useGenerateInterviewQuestionsMutation();

  // Handle job selection
  const handleJobSelect = (jobId: Id<"jobDescriptions">) => {
    setSelectedJobId(jobId);
  };

  // Handle job deletion
  const handleJobDeleted = (deletedJobId: Id<"jobDescriptions">) => {
    if (selectedJobId === deletedJobId) {
      setSelectedJobId(null);
    }
  };

  // Handle AI question generation
  const handleGenerateQuestions = async () => {
    if (selectedJobId && jobDescriptions) {
      const selectedJob = jobDescriptions.find(
        (job) => job._id === selectedJobId,
      );

      if (selectedJob) {
        await generateQuestions({
          jobDescriptionId: selectedJobId,
          title: selectedJob.title,
          description: selectedJob.description,
        });
      }
    }
  };

  return (
    <div className="mx-auto flex flex-col gap-y-3 p-6">
      <h1 className="mb-6 text-3xl font-bold">{t("dashboard.hr.title")}</h1>

      {/* Company Profile Section */}
      <CompanyProfile
        companyId={companyData?._id}
        companyData={companyData}
        onEdit={() => setIsCompanyProfileFormOpen(true)}
      />

      <div className="grid grid-cols-1 gap-y-3 md:grid-cols-3 md:gap-6">
        {/* Left sidebar - Job descriptions */}
        <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex-1 text-xl font-semibold">
              {t("dashboard.hr.jobDescriptions.title")}
            </h2>

            <JobDescriptionForm
              companyId={companyData?._id}
              userId={userData?._id}
            />
          </div>

          {jobDescriptions && jobDescriptions.length > 0 ? (
            <JobDescriptionList
              jobDescriptions={jobDescriptions}
              selectedJobId={selectedJobId}
              onSelect={handleJobSelect}
              onJobDeleted={handleJobDeleted}
            />
          ) : (
            <p className="text-muted-foreground">
              {t("dashboard.hr.jobDescriptions.noJobDescriptions")}
            </p>
          )}
        </div>

        {/* Main content - Questions */}
        <div className="border-border bg-card col-span-2 rounded-lg border p-4 shadow-sm">
          {selectedJobId ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex-1 text-xl font-semibold">
                  {t("dashboard.hr.interviewQuestions.title")}
                </h2>

                <Button
                  onClick={handleGenerateQuestions}
                  variant="default"
                  loading={isGeneratingQuestions}
                >
                  {t(
                    "dashboard.hr.interviewQuestions.generateAIQuestions.button",
                  )}
                </Button>
              </div>

              {questions && questions.length > 0 ? (
                <QuestionsList
                  questions={questions}
                  jobDescriptionId={selectedJobId}
                />
              ) : (
                <p className="text-muted-foreground text-sm md:text-base">
                  {t("dashboard.hr.interviewQuestions.noQuestions")}
                </p>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-lg">
                {t("dashboard.hr.interviewQuestions.selectJobDescription")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resume Matching Section */}
      {selectedJobId && (
        <div className="mt-6">
          <ResumeMatchSearch
            jobId={selectedJobId}
            jobDescription={
              jobDescriptions
                ? jobDescriptions.find((job) => job._id === selectedJobId)
                    ?.description || ""
                : ""
            }
            jobTitle={
              jobDescriptions
                ? jobDescriptions.find((job) => job._id === selectedJobId)
                    ?.title || ""
                : ""
            }
          />
        </div>
      )}

      {/* Company profile form modal */}
      <CompanyProfileForm
        companyId={companyData?._id}
        companyData={companyData}
        open={isCompanyProfileFormOpen}
        setOpen={setIsCompanyProfileFormOpen}
      />
    </div>
  );
}
