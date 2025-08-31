import { api } from "@convex/_generated/api"
import { Link, useRouter } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { useTranslation } from "react-i18next"

import type { Doc } from "@convex/_generated/dataModel"

import { useAuth } from "@/hooks/useAuth"

export function CandidateDashboard() {
  const { userData } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  // Fetch interview sessions for the candidate
  const interviewSessions = useQuery(
    api.interviewSessions.getByCandidate,
    userData ? { candidateId: userData._id } : "skip",
  )

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">
        {t("dashboard.candidate.title")}
      </h1>

      <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          {t("dashboard.candidate.yourInterviews")}
        </h2>

        {interviewSessions && interviewSessions.length > 0 ? (
          <div className="space-y-4">
            {interviewSessions.map((session: Doc<"interviewSessions">) => (
              <div
                key={session._id}
                className="border-border bg-background rounded-md border p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {t("dashboard.candidate.interviewSession")}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t("dashboard.candidate.status")}:{" "}
                      <span className="capitalize">{session.status}</span>
                    </p>
                    {session.scheduledAt && (
                      <p className="text-muted-foreground text-sm">
                        {t("dashboard.candidate.scheduledFor")}:{" "}
                        {new Date(session.scheduledAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div>
                    {session.status === "scheduled" && (
                      <Link
                        to={
                          router.routesByPath["/interview/$sessionId"].fullPath
                        }
                        params={{ sessionId: session._id }}
                        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm"
                      >
                        {t("dashboard.candidate.startInterview")}
                      </Link>
                    )}

                    {session.status === "in_progress" && (
                      <Link
                        to={
                          router.routesByPath["/interview/$sessionId"].fullPath
                        }
                        params={{ sessionId: session._id }}
                        className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm"
                      >
                        {t("dashboard.candidate.continueInterview")}
                      </Link>
                    )}

                    {session.status === "completed" && (
                      <Link
                        to={
                          router.routesByPath["/interview/$sessionId/results"]
                            .fullPath
                        }
                        params={{ sessionId: session._id }}
                        className="bg-secondary text-secondary-foreground rounded px-4 py-2 text-sm"
                      >
                        {t("dashboard.candidate.viewResults")}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted rounded-md p-6 text-center">
            <p className="text-muted-foreground text-lg">
              {t("dashboard.candidate.noInterviews")}
            </p>
            <p className="text-muted-foreground mt-2">
              {t("dashboard.candidate.noInterviewsDescription")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
