import { api } from "@convex/_generated/api"
import { Link, useRouter } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useQuery } from "convex/react"
import { FileText, Calendar, Building } from "lucide-react"
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
    userData ? { candidateEmail: userData.email } : "skip",
  )

  // Fetch invited job descriptions for the candidate
  const invitedJobDescriptions = useQuery(
    api.interviewInvitations.getInvitedJobDescriptions,
    userData ? { candidateEmail: userData.email } : "skip",
  )

  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-3xl font-bold">{t("dashboard.candidate.title")}</h1>

      {/* Invited Job Descriptions Section */}
      {invitedJobDescriptions && invitedJobDescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invited Job Descriptions
            </CardTitle>
            <CardDescription>
              You've been invited to interview for these positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {invitedJobDescriptions.map((item) => (
                <Card key={item._id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {item.company?.name}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700"
                      >
                        Invited
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        Invited{" "}
                        {new Date(
                          item.invitation.createdAt,
                        ).toLocaleDateString()}
                      </div>
                      {item.interviewSession ? (
                        <Link
                          to="/interview/$sessionId"
                          params={{ sessionId: item.interviewSession._id }}
                        >
                          View Details
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Session not created yet
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Sessions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("dashboard.candidate.yourInterviews")}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                            router.routesByPath["/interview/$sessionId"]
                              .fullPath
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
                            router.routesByPath["/interview/$sessionId"]
                              .fullPath
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
        </CardContent>
      </Card>
    </div>
  )
}
