import { api } from "@convex/_generated/api"
import { type Id } from "@convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"

import { JobDescriptionForm } from "./JobDescriptionForm"
import { JobDescriptionList } from "./JobDescriptionList"
import { QuestionsList } from "./QuestionsList"

import { useAuth } from "@/hooks/useAuth"

export function HRDashboard() {
  const { userData, companyData } = useAuth()
  const [selectedJobId, setSelectedJobId] =
    useState<Id<"jobDescriptions"> | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Fetch job descriptions for the company
  const jobDescriptions = useQuery(
    api.jobDescriptions.getByCompany,
    companyData ? { companyId: companyData._id } : "skip",
  )

  // Fetch questions for the selected job
  const questions = useQuery(
    api.interviewQuestions.getByJobDescription,
    selectedJobId ? { jobDescriptionId: selectedJobId } : "skip",
  )

  // Generate AI questions mutation
  const generateQuestions = useMutation(
    api.interviewQuestions.generateAIQuestions,
  )

  // Handle job selection
  const handleJobSelect = (jobId: Id<"jobDescriptions">) => {
    setSelectedJobId(jobId)
  }

  // Handle AI question generation
  const handleGenerateQuestions = async () => {
    if (selectedJobId) {
      await generateQuestions({ jobDescriptionId: selectedJobId })
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">HR Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left sidebar - Job descriptions */}
        <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Job Descriptions</h2>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-primary text-primary-foreground rounded px-3 py-1 text-sm"
            >
              Add New
            </button>
          </div>

          {jobDescriptions && jobDescriptions.length > 0 ? (
            <JobDescriptionList
              jobDescriptions={jobDescriptions}
              selectedJobId={selectedJobId}
              onSelect={handleJobSelect}
            />
          ) : (
            <p className="text-muted-foreground">No job descriptions yet.</p>
          )}
        </div>

        {/* Main content - Questions */}
        <div className="border-border bg-card col-span-2 rounded-lg border p-4 shadow-sm">
          {selectedJobId ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Interview Questions</h2>
                <button
                  onClick={handleGenerateQuestions}
                  className="bg-primary text-primary-foreground rounded px-3 py-1 text-sm"
                >
                  Generate AI Questions
                </button>
              </div>

              {questions && questions.length > 0 ? (
                <QuestionsList questions={questions} />
              ) : (
                <p className="text-muted-foreground">
                  No questions yet. Click "Generate AI Questions" to create
                  questions based on the job description.
                </p>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-lg">
                Select a job description to view or generate questions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Job description form modal */}
      {isFormOpen && (
        <JobDescriptionForm
          companyId={companyData?._id}
          userId={userData?._id}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  )
}
