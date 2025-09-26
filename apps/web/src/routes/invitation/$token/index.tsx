import { api } from "@convex/_generated/api"
import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "react-toastify"

import { useAcceptInvitationMutation } from "./hooks/useAcceptInvitationMutation"
import { useDeclineInvitationMutation } from "./hooks/useDeclineInvitationMutation"

export const Route = createFileRoute("/invitation/$token/")({
  component: InvitationPage,
})

function InvitationPage() {
  const { token } = Route.useParams()
  const navigate = useNavigate()

  const invitation = useConvexQuery(api.interviewInvitations.getByToken, {
    token,
  })

  const acceptInvitation = useAcceptInvitationMutation()
  const declineInvitation = useDeclineInvitationMutation()

  const handleAccept = async () => {
    if (!invitation) return

    try {
      await acceptInvitation.mutateAsync({
        invitationId: invitation._id,
        candidateEmail: invitation.candidateEmail,
      })
      toast.success(
        "Invitation accepted! You can now view the job description.",
      )

      await navigate({ to: "/dashboard" })
    } catch (error) {
      console.error("Error accepting invitation:", error)
      toast.error("Failed to accept invitation. Please try again.")
    }
  }

  const handleDecline = async () => {
    if (!invitation) return

    try {
      await declineInvitation.mutateAsync({
        invitationId: invitation._id,
      })
      toast.success("Invitation declined.")
    } catch (error) {
      console.error("Error declining invitation:", error)
      toast.error("Failed to decline invitation. Please try again.")
    }
  }

  if (acceptInvitation.isPending || declineInvitation.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-2">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const isExpired = invitation.expiresAt < Date.now()
  const isPending = invitation.status === "pending"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Interview Invitation</CardTitle>
                <CardDescription>
                  You've been invited to interview for a position
                </CardDescription>
              </div>
              <Badge
                variant={
                  invitation.status === "accepted"
                    ? "default"
                    : invitation.status === "declined"
                      ? "destructive"
                      : isExpired
                        ? "secondary"
                        : "outline"
                }
              >
                {invitation.status === "accepted" && (
                  <CheckCircle className="mr-1 h-3 w-3" />
                )}
                {invitation.status === "declined" && (
                  <XCircle className="mr-1 h-3 w-3" />
                )}
                {isExpired && <AlertCircle className="mr-1 h-3 w-3" />}
                {isPending && !isExpired && <Clock className="mr-1 h-3 w-3" />}
                {invitation.status === "accepted"
                  ? "Accepted"
                  : invitation.status === "declined"
                    ? "Declined"
                    : isExpired
                      ? "Expired"
                      : "Pending"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">
                Hello {invitation.candidateName || "Candidate"}!
              </h3>
              <p className="text-blue-800">
                You've been invited to interview for a position. Click the
                button below to accept this invitation and view the job
                description.
              </p>
            </div>

            {isExpired && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                  <p className="text-yellow-800">
                    This invitation has expired. Please contact the company for
                    a new invitation.
                  </p>
                </div>
              </div>
            )}

            {invitation.status === "accepted" && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  <p className="text-green-800">
                    You have accepted this invitation. You can now view the job
                    description and start the interview process.
                  </p>
                </div>
              </div>
            )}

            {invitation.status === "declined" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center">
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                  <p className="text-red-800">
                    You have declined this invitation. If you change your mind,
                    please contact the company.
                  </p>
                </div>
              </div>
            )}

            {isPending && !isExpired && (
              <div className="flex gap-3">
                <Button
                  onClick={handleAccept}
                  disabled={acceptInvitation.isPending}
                  className="flex-1"
                >
                  {acceptInvitation.isPending
                    ? "Accepting..."
                    : "Accept Invitation"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={declineInvitation.isPending}
                  className="flex-1"
                >
                  {declineInvitation.isPending ? "Declining..." : "Decline"}
                </Button>
              </div>
            )}

            {invitation.status === "accepted" && (
              <div className="text-center">
                <Button onClick={() => navigate({ to: "/dashboard" })}>
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
