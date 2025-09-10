import { type Doc } from "@convex/_generated/dataModel"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Check, X } from "lucide-react"
import { type FieldErrors, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { useUpdateJobDescriptionMutation } from "../../hooks/useUpdateJobDescriptionMutation"

import {
  jobDescriptionSchema,
  type JobDescriptionFormData,
} from "@/schema/jobDescription"

interface EditJobDescriptionFormProps {
  job: Doc<"jobDescriptions">
  onCancel: () => void
  onSuccess?: () => void
}

export function EditJobDescriptionForm({
  job,
  onCancel,
  onSuccess,
}: EditJobDescriptionFormProps) {
  const { t } = useTranslation()
  const { mutateAsync: updateJobDescription, isPending: isUpdating } =
    useUpdateJobDescriptionMutation()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<JobDescriptionFormData>({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: {
      title: job.title,
      description: job.description,
    },
    mode: "onChange",
  })

  const onSubmit = async (data: JobDescriptionFormData) => {
    await updateJobDescription({
      id: job._id,
      title: data.title,
      description: data.description,
    })
    onSuccess?.()
  }

  const onInvalid = (errors: FieldErrors<JobDescriptionFormData>) => {
    const errorMessages = Object.values(errors)
      .map((error) => error.message)
      .join(", ")
    toast.error(errorMessages)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t("jobDescription.form.jobTitle")}</Label>

        <Input
          id="title"
          {...register("title")}
          className={errors.title ? "border-red-500" : ""}
          disabled={isUpdating}
        />

        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          {t("jobDescription.form.jobDescription")}
        </Label>

        <Textarea
          id="description"
          {...register("description")}
          rows={8}
          disabled={isUpdating}
          className="min-h-30"
        />

        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={!isValid || isUpdating}
          className="flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          {isUpdating
            ? t("dashboard.hr.jobDescriptions.actions.edit.saving")
            : t("dashboard.hr.jobDescriptions.actions.edit.save")}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isUpdating}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          {t("dashboard.hr.jobDescriptions.actions.edit.cancel")}
        </Button>
      </div>
    </form>
  )
}
