import { type Doc } from "@convex/_generated/dataModel"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { UserPlus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { useCreateInvitationMutation } from "./hooks/useCreateInvitationMutation"
import {
  type InviteCandidateFormData,
  inviteCandidateSchema,
} from "./schema/inviteCandidate"

import { useAuth } from "@/hooks/useAuth"

interface InviteCandidateFormProps {
  job: Doc<"jobDescriptions">
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function InviteCandidateForm({
  job,
  trigger,
  onSuccess,
}: InviteCandidateFormProps) {
  const [open, setOpen] = useState(false)
  const { mutateAsync: createInvitation, isPending: isCreatingInvitation } =
    useCreateInvitationMutation()
  const { t } = useTranslation()

  const { userData } = useAuth()

  const form = useForm<InviteCandidateFormData>({
    resolver: zodResolver(inviteCandidateSchema),
    defaultValues: {
      candidateEmail: "",
      message: "",
    },
  })

  const onSubmit = async (data: InviteCandidateFormData) => {
    try {
      if (!userData) return

      await createInvitation({
        jobDescriptionId: job._id,
        candidateEmail: data.candidateEmail,
        personalMessage: data.message,
        invitedBy: userData?._id,
      })

      toast.success(t("dashboard.hr.inviteCandidate.actions.success"))
      form.reset()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.log(error)
      console.error("Error sending invitation:", error)

      // Handle specific error messages
      const errorMessage = error instanceof Error ? error.message : ""

      if (errorMessage.includes("Account not found")) {
        toast.error(t("dashboard.hr.inviteCandidate.actions.accountNotFound"))
      } else if (errorMessage.includes("HR manager")) {
        toast.error(t("dashboard.hr.inviteCandidate.actions.invalidRole"))
      } else if (errorMessage.includes("already been invited")) {
        toast.error(t("dashboard.hr.inviteCandidate.actions.alreadyInvited"))
      } else {
        toast.error(t("dashboard.hr.inviteCandidate.actions.error"))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t("dashboard.hr.inviteCandidate.button")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dashboard.hr.inviteCandidate.title")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                {t("dashboard.hr.inviteCandidate.description")}{" "}
                <strong>{job.title}</strong>
              </p>
            </div>

            <FormField
              control={form.control}
              name="candidateEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dashboard.hr.inviteCandidate.emailLabel")}
                  </FormLabel>
                  <Input
                    {...field}
                    type="email"
                    placeholder={t(
                      "dashboard.hr.inviteCandidate.emailPlaceholder",
                    )}
                    disabled={isCreatingInvitation}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dashboard.hr.inviteCandidate.messageLabel")}
                  </FormLabel>
                  <Textarea
                    {...field}
                    placeholder={t(
                      "dashboard.hr.inviteCandidate.messagePlaceholder",
                    )}
                    disabled={isCreatingInvitation}
                    rows={3}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isCreatingInvitation}
              >
                {t("dashboard.hr.inviteCandidate.cancel")}
              </Button>
              <Button type="submit" disabled={isCreatingInvitation}>
                {isCreatingInvitation
                  ? t("dashboard.hr.inviteCandidate.sending")
                  : t("dashboard.hr.inviteCandidate.sendInvitation")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
