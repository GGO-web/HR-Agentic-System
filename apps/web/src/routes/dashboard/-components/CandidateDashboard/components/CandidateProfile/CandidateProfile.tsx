import { useUser } from "@clerk/clerk-react";
import { api } from "@convex/_generated/api";
import { type Id } from "@convex/_generated/dataModel";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { AvatarUpload } from "@workspace/ui/components/file-upload/avatar-upload";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { type FileWithPreview } from "@workspace/ui/hooks/use-file-upload";
import { useMutation, useQuery } from "convex/react";
import { Loader2, User } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { z } from "zod";

import { ResumeUploadButton } from "@/components/resume-upload-button/ResumeUploadButton";
import { useAuth } from "@/hooks/useAuth";
import { uploadResumeToS3, deleteResumeFromS3 } from "@/services/s3Service";
import { useProcessResumeMutation } from "@/routes/dashboard/-components/HRDashboard/hooks/useProcessResumeMutation";
import { useDeleteResumeMutation } from "@/routes/dashboard/-components/HRDashboard/hooks/useDeleteResumeMutation";

const candidateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type CandidateProfileFormData = z.infer<typeof candidateProfileSchema>;

interface CandidateProfileProps {
  userId: Id<"users">;
}

export function CandidateProfile({ userId }: CandidateProfileProps) {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { user: clerkUser } = useUser(); // Get Clerk user for updating profile

  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Get the current resume attachment if it exists
  const resumeAttachmentId = userData?.resumeAttachmentId;
  const resumeAttachment = useQuery(
    api.attachments.queryByIds,
    resumeAttachmentId ? { ids: [resumeAttachmentId] } : "skip",
  );

  const updateCandidateProfile = useMutation(api.users.updateCandidateProfile);
  const createAttachment = useMutation(api.attachments.create);
  const { mutateAsync: processResume } = useProcessResumeMutation();
  const { mutateAsync: deleteResumeFromChroma } = useDeleteResumeMutation();

  const form = useForm<CandidateProfileFormData>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      name: userData?.name || "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleResumeUpload = async (file: File) => {
    setResumeFile(file);
  };

  const handleImageFileChange = async (file: FileWithPreview | null) => {
    if (file && clerkUser) {
      try {
        // Update Clerk profile picture
        await clerkUser.setProfileImage({ file: file.file as File });
      } catch (error) {
        console.error("Error updating profile picture:", error);
        toast.error(t("profile.profilePicture.updateError"));
      }
    }
  };

  const handleImageRemove = async () => {
    if (clerkUser?.hasImage) {
      await clerkUser.setProfileImage({ file: null });
    }
  };

  const handleResumeRemove = async () => {
    // Get the current resume URL
    const currentResumeUrl = resumeAttachment?.[0]?.fileUrl;

    if (currentResumeUrl) {
      try {
        // Delete from S3
        const result = await deleteResumeFromS3(currentResumeUrl);
        if (result.success) {
          // Delete from ChromaDB
          try {
            await deleteResumeFromChroma(String(userId));
          } catch (error) {
            console.error("Error deleting resume from ChromaDB:", error);
            // Don't fail the whole operation if ChromaDB deletion fails
            toast.warning(t("profile.resume.chromaDeleteWarning"));
          }

          // Update the user to remove the resume attachment
          await updateCandidateProfile({
            userId,
            resumeAttachmentId: undefined,
          });
          toast.success(t("profile.resume.removed"));
        } else {
          toast.error(t("profile.resume.removeError"));
        }
      } catch (error) {
        console.error("Error removing resume:", error);
        toast.error(t("profile.resume.removeError"));
      }
    }

    setResumeFile(null);
  };

  const onSubmit = async (data: CandidateProfileFormData) => {
    try {
      // If there's a new resume file, upload it
      let newResumeAttachmentId: Id<"attachments"> | undefined = undefined;

      if (resumeFile) {
        // Upload the new resume to S3
        const uploadResult = await uploadResumeToS3(resumeFile, userId);

        if (uploadResult.success && uploadResult.url) {
          // Create attachment record
          const uploadedAttachments = await createAttachment({
            files: [
              {
                name: resumeFile.name,
                type: resumeFile.type,
                size: resumeFile.size,
                url: uploadResult.url,
              },
            ],
          });

          newResumeAttachmentId = uploadedAttachments[0]?._id;

          // Delete old resume if exists
          if (resumeAttachment?.[0]?.fileUrl) {
            await deleteResumeFromS3(resumeAttachment[0].fileUrl);
            // Also delete from ChromaDB
            try {
              await deleteResumeFromChroma(String(userId));
            } catch (error) {
              console.error("Error deleting old resume from ChromaDB:", error);
              // Don't fail the whole operation if ChromaDB deletion fails
            }
          }
        } else {
          toast.error(uploadResult.error || t("profile.resume.uploadError"));
          return;
        }
      }

      // Update the user profile
      await updateCandidateProfile({
        userId,
        name: data.name,
        resumeAttachmentId: newResumeAttachmentId || resumeAttachmentId,
      });

      toast.success(t("profile.updateSuccess"));

      // Process resume through hybrid search API if we have a new resume
      if (resumeFile && newResumeAttachmentId) {
        try {
          await processResume({
            file: resumeFile,
            candidateId: String(userId), // Ensure it's a string
          });
          toast.success(t("profile.resume.processed"));
        } catch (error) {
          console.error("Error processing resume for hybrid search:", error);
          // Don't fail the profile update if resume processing fails
          toast.warning(t("profile.resume.processWarning"));
        }
      }

      // Reset the form state
      setResumeFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("profile.updateError"));
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold md:text-3xl">{t("profile.title")}</h1>

      <Card className="p-6">
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <AvatarUpload
                  isDefaultAvatar={!user?.hasImage}
                  defaultAvatar={user?.imageUrl}
                  onFileChange={handleImageFileChange}
                  onRemove={handleImageRemove}
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <User className="h-5 w-5" />
                {t("profile.basicInformation")}
              </h3>

              <div>
                <Label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("profile.name")} *
                </Label>
                <Input
                  id="name"
                  type="text"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                  placeholder={t("profile.namePlaceholder")}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Resume Upload */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-medium">
                {t("profile.resume.title")}
              </h3>

              <ResumeUploadButton
                defaultFile={resumeAttachment?.[0]?.fileName}
                onUpload={handleResumeUpload}
                onRemove={handleResumeRemove}
              />

              <p className="text-muted-foreground text-sm">
                {t("profile.resume.hint")}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 border-t pt-6">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {form.formState.isSubmitting
                  ? t("profile.saving")
                  : t("profile.save")}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
