import { api } from "@convex/_generated/api"
import { type Doc, type Id } from "@convex/_generated/dataModel"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useMutation } from "convex/react"
import { Building2 } from "lucide-react"
import { useState } from "react"
import { type FieldErrors, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { ImageUploader } from "@/components/upload-button/UploadButton"
import { useAuth } from "@/hooks/useAuth"
import { companySchema, type CompanyFormData } from "@/schema/company"
import { uploadImageToS3, deleteLogoFromS3 } from "@/services/s3Service"

interface CompanyProfileFormProps {
  companyId?: Id<"companies">
  companyData?: Doc<"companies"> | null
  onClose: () => void
}

export function CompanyProfileForm({
  companyId,
  companyData,
  onClose,
}: CompanyProfileFormProps) {
  const { t } = useTranslation()
  const { user, userData } = useAuth()
  const createCompany = useMutation(api.companies.create)
  const updateCompany = useMutation(api.companies.update)
  const updateUser = useMutation(api.users.update)

  const isEditing = Boolean(companyId && companyData)
  const [logoUrl, setLogoUrl] = useState<string | null>(
    companyData?.logoUrl || null,
  )
  const [imageFile, setImageFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: (companyData?.name as string) || "",
      description: (companyData?.description as string) || "",
    },
  })

  const handleUploadImage = async (file: File, companyIdParam = companyId) => {
    setImageFile(file)

    if (!companyIdParam) return
    try {
      const result = await uploadImageToS3(file, companyIdParam)

      if (result.success && result.url) {
        setLogoUrl(result.url)

        await updateCompany({
          id: companyIdParam,
          logoUrl: result.url || undefined,
        })
      }
    } catch (error) {
      console.error(error)
      toast.error(t("company.form.uploadError"))
    } finally {
      setImageFile(null)
    }
  }

  const handleRemoveLogo = async () => {
    if (!companyId) return
    // Determine which logo URL to delete (current state or original company data)
    const logoToDelete = logoUrl || companyData?.logoUrl

    // If there's a logo URL, delete it from S3
    if (logoToDelete) {
      const result = await deleteLogoFromS3(logoToDelete)

      if (!result.success) {
        throw new Error(`Failed to delete logo from S3: ${result.error}`)
      }

      await updateCompany({
        id: companyId,
        logoUrl: "",
      })
    }

    // Clear the logo URL from state
    setLogoUrl(null)
  }

  const onSubmit = async (data: CompanyFormData) => {
    try {
      if (isEditing && companyId) {
        await updateCompany({
          id: companyId,
          ...data,
          logoUrl: logoUrl || undefined,
        })
        toast.success(t("company.form.updateSuccess"))
        onClose()
      } else {
        // Create new company and link it to the user
        if (!userData?._id || !user?.id) {
          toast.error(t("company.form.userNotFound"))
          return
        }

        const newCompanyId = await createCompany({
          name: data.name,
          description: data.description,
          logoUrl: logoUrl || undefined,
          clerkId: user.id,
        })

        if (imageFile) {
          await handleUploadImage(imageFile, newCompanyId)
        }

        // Update user with company reference
        await updateUser({
          id: userData._id,
          companyId: newCompanyId,
        })

        toast.success(t("company.form.createSuccess"))
        onClose()
      }
    } catch {
      toast.error(t("company.form.saveError"))
    }
  }

  const onInvalid = (errors: FieldErrors<CompanyFormData>) => {
    const errorMessages = Object.values(errors)
      .map((error) => error.message)
      .join(", ")
    toast.error(errorMessages)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <Building2 className="text-primary h-6 w-6" />
          <h2 className="text-2xl font-semibold">
            {isEditing
              ? t("company.form.editTitle")
              : t("company.form.createTitle")}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="space-y-6"
        >
          {/* Logo Upload */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              <Building2 className="h-5 w-5" />
              {t("company.profile.companyLogo")}
            </h3>
            <ImageUploader
              defaultPreview={companyData?.logoUrl}
              onUpload={handleUploadImage}
              onRemove={handleRemoveLogo}
            />
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              <Building2 className="h-5 w-5" />
              {t("company.profile.companyInformation")}
            </h3>

            <div>
              <Label htmlFor="name" className="mb-1 block text-sm font-medium">
                {t("company.form.companyName")} *
              </Label>
              <Input
                id="name"
                type="text"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
                placeholder={t("company.form.companyNamePlaceholder")}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="description"
                className="mb-1 block text-sm font-medium"
              >
                {t("company.form.description")}
              </Label>
              <textarea
                id="description"
                {...register("description")}
                className={`border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-32 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.description ? "border-red-500" : ""
                }`}
                placeholder={t("company.form.descriptionPlaceholder")}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("company.form.cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground rounded-md px-6 py-2"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting
                ? t("company.form.saving")
                : isEditing
                  ? t("company.form.update")
                  : t("company.form.create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
