import { type Doc, type Id } from "@convex/_generated/dataModel"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Form, FormField, FormItem } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { type FieldErrors, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { JOB_DESCRIPTION_DEFAULT_VALUES } from "./constants"
import { useCreateJobDescriptionMutation } from "./hooks/useCreateJobDescriptionMutation"
import { useUpdateJobDescriptionMutation } from "./hooks/useUpdateJobDescriptionMutation"

import {
  jobDescriptionSchema,
  type JobDescriptionFormData,
} from "@/schema/jobDescription"

interface JobDescriptionFormProps {
  trigger?: React.ReactNode
  companyId?: Id<"companies">
  userId?: Id<"users">
  job?: Doc<"jobDescriptions">
  onClose?: () => void
  onSuccess?: () => void
}

export function JobDescriptionForm({
  trigger,
  companyId,
  userId,
  job,
  onClose,
  onSuccess,
}: JobDescriptionFormProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const { mutateAsync: createJobDescription, isPending: isCreating } =
    useCreateJobDescriptionMutation()
  const { mutateAsync: updateJobDescription, isPending: isUpdating } =
    useUpdateJobDescriptionMutation()

  const form = useForm<JobDescriptionFormData>({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: job
      ? {
          title: job.title,
          description: job.description,
        }
      : JOB_DESCRIPTION_DEFAULT_VALUES,
  })

  const {
    handleSubmit,
    formState: { isSubmitting, isValid },
    reset,
  } = form

  const onSubmit = async (data: JobDescriptionFormData) => {
    try {
      if (job) {
        await updateJobDescription({
          id: job._id,
          title: data.title,
          description: data.description,
        })
      } else {
        if (!companyId || !userId) {
          toast.error(
            `Missing required data. 
            - Company ID: ${companyId} 
            - User ID: ${userId}`,
          )
          return
        }

        await createJobDescription({
          title: data.title,
          description: data.description,
          companyId,
          createdBy: userId,
        })

        reset()
      }

      onSuccess?.()
      setIsOpen(false)
    } catch {
      toast.error("Failed to create job description. Please try again.")
    }
  }

  const onInvalid = (errors: FieldErrors<JobDescriptionFormData>) => {
    const errorMessages = Object.values(errors)
      .map((error) => error.message)
      .join(", ")
    toast.error(errorMessages)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <PlusIcon className="size-4" />
            {t("dashboard.hr.jobDescriptions.form.buttons.addNew")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>
          {t("dashboard.hr.jobDescriptions.form.title")}
        </DialogTitle>

        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <Label
                    htmlFor="title"
                    className="mb-1 block text-sm font-medium"
                  >
                    {t("dashboard.hr.jobDescriptions.form.jobTitle")}
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    {...field}
                    placeholder={t(
                      "dashboard.hr.jobDescriptions.form.jobTitlePlaceholder",
                    )}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <Label
                    htmlFor="description"
                    className="mb-1 block text-sm font-medium"
                  >
                    {t("dashboard.hr.jobDescriptions.form.jobDescription")}
                  </Label>

                  <Textarea
                    id="description"
                    {...field}
                    className="min-h-30"
                    disabled={isSubmitting}
                    placeholder={t(
                      "dashboard.hr.jobDescriptions.form.jobDescriptionPlaceholder",
                    )}
                  />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onClose?.()
                }}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>

              <Button
                type="submit"
                className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting || isUpdating || isCreating
                  ? t("common.loading")
                  : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
