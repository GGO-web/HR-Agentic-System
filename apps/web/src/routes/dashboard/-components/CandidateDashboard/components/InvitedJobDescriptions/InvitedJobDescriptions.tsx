import { api } from "@convex/_generated/api"
import { useRouter } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@workspace/ui/components/card"
import { useQuery } from "convex/react"
import { Building, Calendar, FileText } from "lucide-react"
import React from "react"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/hooks/useAuth"

export const InvitedJobDescriptions = () => {
  const { userData } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()

  // Fetch invited job descriptions for the candidate
  const invitedJobDescriptions = useQuery(
    api.interviewInvitations.getInvitedJobDescriptions,
    userData ? { candidateEmail: userData.email } : "skip",
  )

  return (
    invitedJobDescriptions &&
    invitedJobDescriptions.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("dashboard.candidate.invitedJobDescriptions.title")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.candidate.invitedJobDescriptions.description")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {invitedJobDescriptions.map((item) => (
              <Card key={item._id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1">
                    <Building className="size-4" />
                    {item.company?.name}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {t(
                        "dashboard.candidate.invitedJobDescriptions.invited",
                      )}{" "}
                      {new Date(item.invitation.createdAt).toLocaleDateString()}
                    </div>

                    {item.interviewSession ? (
                      <Button
                        onClick={() => {
                          void router.navigate({
                            to: "/interview/$sessionId",
                            params: {
                              sessionId: item.interviewSession?._id ?? "",
                            },
                          })
                        }}
                      >
                        {t(
                          "dashboard.candidate.invitedJobDescriptions.viewDetails",
                        )}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {t(
                          "dashboard.candidate.invitedJobDescriptions.sessionNotCreated",
                        )}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  )
}
