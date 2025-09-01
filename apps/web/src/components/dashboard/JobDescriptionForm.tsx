import { api } from "@convex/_generated/api"
import { type Id } from "@convex/_generated/dataModel"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useMutation } from "convex/react"
import { type FieldErrors, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import {
  jobDescriptionSchema,
  type JobDescriptionFormData,
} from "../../schema/jobDescription"

interface JobDescriptionFormProps {
  companyId?: Id<"companies">
  userId?: Id<"users">
  onClose: () => void
}

export function JobDescriptionForm({
  companyId,
  userId,
  onClose,
}: JobDescriptionFormProps) {
  const { t } = useTranslation()
  const createJobDescription = useMutation(api.jobDescriptions.create)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<JobDescriptionFormData>({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const onSubmit = async (data: JobDescriptionFormData) => {
    if (!companyId || !userId) {
      toast.error(
        `Missing required data. 
        - Company ID: ${companyId} 
        - User ID: ${userId}`,
      )
      return
    }

    try {
      await createJobDescription({
        title: data.title,
        description: data.description,
        companyId,
        createdBy: userId,
      })

      toast.success("Job description created successfully!")
      reset()
      onClose()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background w-full max-w-lg rounded-lg p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">
          {t("jobDescription.form.title")}
        </h2>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="mb-4">
            <Label htmlFor="title" className="mb-1 block text-sm font-medium">
              {t("jobDescription.form.jobTitle")}
            </Label>
            <Input
              id="title"
              type="text"
              {...register("title")}
              className={errors.title ? "border-red-500" : ""}
              placeholder="Enter job title"
            />
          </div>

          <div className="mb-6">
            <Label
              htmlFor="description"
              className="mb-1 block text-sm font-medium"
            >
              {t("jobDescription.form.jobDescription")}
            </Label>
            <textarea
              id="description"
              {...register("description")}
              className={`border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-40 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.description ? "border-red-500" : ""
              }`}
              placeholder="Enter detailed job description..."
            />
            <p className="text-muted-foreground mt-1 text-xs">
              {t("jobDescription.form.descriptionHint")}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
