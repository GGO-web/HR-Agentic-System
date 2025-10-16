import { type Doc, type Id } from "@convex/_generated/dataModel";
import { useCreateAttachmentsMutation } from "@convex/hooks/useCreateAttachmentsMutation";
import { useGetAttachmentsQuery } from "@convex/hooks/useGetAttachmentsQuery";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Form, FormField, FormItem } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { ProgressUpload } from "@workspace/ui/components/progress-upload";
import { Textarea } from "@workspace/ui/components/textarea";
import { type FileWithPreview } from "@workspace/ui/hooks/use-file-upload";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { JOB_DESCRIPTION_DEFAULT_VALUES } from "./constants";
import { useCreateJobDescriptionMutation } from "./hooks/useCreateJobDescriptionMutation";
import { useUpdateJobDescriptionMutation } from "./hooks/useUpdateJobDescriptionMutation";

import {
  jobDescriptionSchema,
  type JobDescriptionFormData,
} from "@/schema/jobDescription";
import { deleteFileFromS3, uploadFileToS3 } from "@/services/s3Service";

interface JobDescriptionFormProps {
  trigger?: React.ReactNode;
  companyId?: Id<"companies">;
  userId?: Id<"users">;
  job?: Doc<"jobDescriptions">;
  onClose?: () => void;
  onSuccess?: () => void;
  className?: string;
}

export function JobDescriptionForm({
  className,
  trigger,
  companyId,
  userId,
  job,
  onClose,
  onSuccess,
}: JobDescriptionFormProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const { mutateAsync: createJobDescription, isPending: isCreating } =
    useCreateJobDescriptionMutation();
  const { mutateAsync: updateJobDescription, isPending: isUpdating } =
    useUpdateJobDescriptionMutation();
  const { mutateAsync: createAttachments } = useCreateAttachmentsMutation();

  const { data: attachments } = useGetAttachmentsQuery(
    job?.files.map((file) => file as Id<"attachments">) || [],
  );

  const form = useForm<JobDescriptionFormData>({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: job
      ? {
          title: job.title,
          description: job.description,
          files: job.files,
        }
      : JOB_DESCRIPTION_DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = form;

  const onSubmit = async (data: JobDescriptionFormData) => {
    try {
      const files = (data.files as FileWithPreview[]).map(
        (file) => file.file as File,
      );
      const fileNames = files.map((file) => file.name);

      const attachmentFileNames = (attachments || []).map(
        (attachment) => attachment?.fileName,
      );

      const filesToUpload = files.filter(
        (file) => !attachmentFileNames?.includes(file.name),
      );
      const attachmentsToSkip = (attachments || [])
        ?.filter((attachment) => fileNames.includes(attachment?.fileName ?? ""))
        .map((attachment) => ({
          name: attachment?.fileName ?? "",
          type: attachment?.fileType ?? "",
          size: attachment?.fileSize ?? 0,
          url: attachment?.fileUrl ?? "",
        }));

      const filesToDelete = (attachments || [])?.filter(
        (attachment) => !fileNames.includes(attachment?.fileName ?? ""),
      );

      await Promise.all(
        filesToDelete.map(async (file) => {
          await deleteFileFromS3(file?.fileUrl ?? "");
        }),
      );

      const uploadedFiles = await Promise.all(
        filesToUpload.map(async (file) => {
          const result = await uploadFileToS3(file);

          return {
            name: file.name,
            type: file.type,
            size: file.size,
            url: result.url || "",
          };
        }),
      );

      const allUploadedFiles = [...uploadedFiles, ...attachmentsToSkip];
      const uploadedAttachments = await createAttachments({
        files: allUploadedFiles,
      });

      const attachmentIds = uploadedAttachments.map(
        (attachment) => attachment?._id,
      );

      if (job) {
        await updateJobDescription({
          id: job._id,
          title: data.title,
          description: data.description,
          files: attachmentIds,
        });
      } else {
        if (!companyId || !userId) {
          toast.error(
            `Missing required data. 
            - Company ID: ${companyId} 
            - User ID: ${userId}`,
          );
          return;
        }

        await createJobDescription({
          title: data.title,
          description: data.description,
          files: attachmentIds,
          companyId,
          createdBy: userId,
        });

        reset();
      }

      onSuccess?.();
      setIsOpen(false);
    } catch {
      toast.error("Failed to create job description. Please try again.");
    }
  };

  const onInvalid = (errors: FieldErrors<JobDescriptionFormData>) => {
    const errorMessages = Object.values(errors)
      .map((error) => error.message)
      .join(", ");
    toast.error(errorMessages);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className={className}>
            <PlusIcon className="size-4" />
            {t("dashboard.hr.jobDescriptions.form.buttons.addNew")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto">
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
                    className="max-h-100 min-h-30"
                    disabled={isSubmitting}
                    placeholder={t(
                      "dashboard.hr.jobDescriptions.form.jobDescriptionPlaceholder",
                    )}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="files">Files</Label>

                  <ProgressUpload
                    onFilesChange={field.onChange}
                    defaultFiles={(attachments || [])?.map((attachment) => ({
                      id: attachment?._id ?? "",
                      name: attachment?.fileName ?? "",
                      size: attachment?.fileSize ?? 0,
                      type: attachment?.fileType ?? "",
                      url: attachment?.fileUrl ?? "",
                    }))}
                  />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>

              <Button type="submit">
                {isSubmitting || isUpdating || isCreating
                  ? t("common.loading")
                  : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
