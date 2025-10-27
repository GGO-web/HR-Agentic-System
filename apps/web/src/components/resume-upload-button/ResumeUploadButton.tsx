import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { FileText, X } from "lucide-react";
import React from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { ACCEPTED_RESUME_TYPES, MAX_RESUME_SIZE } from "@/constants/s3";

interface ResumeUploadButtonProps {
  defaultFile?: string | null;
  onUpload: (file: File) => void;
  onRemove?: () => void | Promise<void>;
}

export const ResumeUploadButton: React.FC<ResumeUploadButtonProps> = ({
  defaultFile,
  onUpload,
  onRemove,
}) => {
  const { t } = useTranslation();

  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(
    defaultFile ?? null,
  );

  // Update preview when defaultFile changes (e.g., on page refresh/data load)
  React.useEffect(() => {
    if (!file && defaultFile) {
      setPreview(defaultFile);
    }
  }, [defaultFile, file]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection?.errors.some((e) => e.code === "file-too-large")) {
          toast.error("File size must be less than 10MB");
        } else if (
          rejection?.errors.some((e) => e.code === "file-invalid-type")
        ) {
          toast.error("Only PDF, DOC, and DOCX files are allowed");
        } else {
          toast.error("File upload failed");
        }
        return;
      }

      if (!acceptedFiles[0]) return;

      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      setPreview(uploadedFile.name);
      onUpload(uploadedFile);
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      maxSize: MAX_RESUME_SIZE,
      accept: ACCEPTED_RESUME_TYPES,
    });

  const handleRemoveFile = async () => {
    try {
      if (onRemove) {
        await onRemove();
      }
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error(error);
      toast.error(t("resumeUploadButton.removeError"));
    }
  };

  const hasFile = file || preview;

  return (
    <div className="mx-auto md:w-1/2">
      <div
        {...getRootProps()}
        className="border-foreground group relative mx-auto flex cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg border border-dashed p-4 shadow-lg"
      >
        {hasFile && (
          <>
            <div className="flex items-center gap-2">
              <FileText className="h-12 w-12" />
              <div className="text-left">
                <p className="font-medium">{preview || "Resume uploaded"}</p>
                {file && (
                  <p className="text-muted-foreground text-sm">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
            </div>

            {onRemove && (
              <Button
                type="button"
                variant="destructive"
                className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-red-500 p-2 hover:bg-red-600"
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleRemoveFile();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </>
        )}

        {!hasFile && (
          <>
            <FileText className="size-20" />
            <p className="m-0 text-sm">
              <Trans
                i18nKey={
                  isDragActive
                    ? "resumeUploadButton.dropResume"
                    : "resumeUploadButton.clickHereOrDragResume"
                }
                components={{ b: <b /> }}
              />
            </p>
          </>
        )}

        <Input {...getInputProps()} type="file" />
      </div>

      {fileRejections.length > 0 && (
        <p className="text-destructive mt-2 text-sm">
          {fileRejections[0]?.errors[0]?.message || "Invalid file"}
        </p>
      )}
    </div>
  );
};
