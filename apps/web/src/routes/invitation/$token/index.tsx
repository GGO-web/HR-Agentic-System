import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useAcceptInvitationMutation } from "./-hooks/useAcceptInvitationMutation";
import { useDeclineInvitationMutation } from "./-hooks/useDeclineInvitationMutation";
import { useGetInvitationByTokenQuery } from "./-hooks/useGetInvitationByTokenQuery";

export const Route = createFileRoute("/invitation/$token/")({
  component: InvitationPage,
});

function InvitationPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error: invitationError,
  } = useGetInvitationByTokenQuery(token);

  const acceptInvitation = useAcceptInvitationMutation();
  const declineInvitation = useDeclineInvitationMutation();

  const handleAccept = async () => {
    if (isLoadingInvitation || !invitation) return;

    try {
      await acceptInvitation.mutateAsync({
        invitationId: invitation._id,
      });
      toast.success(t("invitation.actions.acceptSuccess"));

      await navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error(t("invitation.actions.acceptError"));
    }
  };

  const handleDecline = async () => {
    if (isLoadingInvitation || !invitation) return;

    try {
      await declineInvitation.mutateAsync({
        invitationId: invitation._id,
      });
      toast.success(t("invitation.actions.declineSuccess"));
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error(t("invitation.actions.declineError"));
    }
  };

  if (
    acceptInvitation.isPending ||
    declineInvitation.isPending ||
    isLoadingInvitation
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-2">
            {t("invitation.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (invitationError || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
            <CardTitle>{t("invitation.notFound.title")}</CardTitle>
            <CardDescription>
              {t("invitation.notFound.description")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isExpired = invitation.expiresAt < Date.now();
  const isPending = invitation.status === "pending";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {t("invitation.title")}
                </CardTitle>
                <CardDescription>{t("invitation.description")}</CardDescription>
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
                  ? t("invitation.status.accepted")
                  : invitation.status === "declined"
                    ? t("invitation.status.declined")
                    : isExpired
                      ? t("invitation.status.expired")
                      : t("invitation.status.pending")}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {isPending && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-900">
                  {t("invitation.greeting", {
                    name: invitation.candidateName || t("common.candidate"),
                  })}
                </h3>
                <p className="text-blue-800">{t("invitation.message")}</p>
              </div>
            )}

            {isExpired && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                  <p className="text-yellow-800">
                    {t("invitation.expired.message")}
                  </p>
                </div>
              </div>
            )}

            {invitation.status === "accepted" && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  <p className="text-green-800">
                    {t("invitation.accepted.message")}
                  </p>
                </div>
              </div>
            )}

            {invitation.status === "declined" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center">
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                  <p className="text-red-800">
                    {t("invitation.declined.message")}
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
                  loading={acceptInvitation.isPending}
                >
                  {t("invitation.actions.accept")}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={declineInvitation.isPending}
                  className="flex-1"
                  loading={declineInvitation.isPending}
                >
                  {t("invitation.actions.decline")}
                </Button>
              </div>
            )}

            {invitation.status === "accepted" && (
              <div className="text-center">
                <Button onClick={() => navigate({ to: "/dashboard" })}>
                  {t("invitation.actions.goToDashboard")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
