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

      toast.success("Invitation sent successfully!")
      form.reset()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.log(error)
      console.error("Error sending invitation:", error)
      toast.error("Failed to send invitation. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Candidate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Candidate for Interview</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Invite a candidate to interview for:{" "}
                <strong>{job.title}</strong>
              </p>
            </div>

            <FormField
              control={form.control}
              name="candidateEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    {...field}
                    type="email"
                    placeholder="candidate@example.com"
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
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <Textarea
                    {...field}
                    placeholder="Add a personal message to the invitation..."
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
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingInvitation}>
                {isCreatingInvitation ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
