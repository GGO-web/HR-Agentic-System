"use client";

import { TriangleAlert, User, X } from "lucide-react";
import { useEffect } from "react";

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  formatBytes,
  useFileUpload,
  type FileWithPreview,
} from "@workspace/ui/hooks/use-file-upload";
import { cn } from "@workspace/ui/lib/utils";

interface AvatarUploadProps {
  maxSize?: number;
  className?: string;
  onFileChange?: (file: FileWithPreview | null) => void;
  defaultAvatar?: string;
  isDefaultAvatar?: boolean;
  onRemove?: () => void;
}

export function AvatarUpload({
  maxSize = 2 * 1024 * 1024, // 2MB
  className,
  onFileChange,
  defaultAvatar,
  isDefaultAvatar,
  onRemove,
}: AvatarUploadProps) {
  const [
    { files, isDragging, errors },
    {
      addFiles,
      removeFile,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize,
    accept: "image/*",
    multiple: false,
    onFilesChange: (files) => {
      onFileChange?.(files[0] || null);
    },
  });

  const currentFile = files[0];
  const previewUrl = currentFile?.preview || defaultAvatar;

  const handleRemove = () => {
    if (currentFile) {
      removeFile(currentFile.id);
    }

    onRemove?.();
  };

  const addDefaultAvatar = async () => {
    if (defaultAvatar) {
      const response = await fetch(defaultAvatar);
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([new Uint8Array(arrayBuffer)], {
        type: "image/jpeg",
      });
      const file = new File([blob], "avatar.jpeg", { type: "image/jpeg" });
      addFiles([file], false);
    }
  };

  useEffect(() => {
    void addDefaultAvatar();
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Avatar Preview */}
      <div className="relative">
        <div
          className={cn(
            "group/avatar relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/20",
            previewUrl && "border-solid",
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input {...getInputProps()} className="sr-only" />

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="text-muted-foreground size-6" />
            </div>
          )}
        </div>

        {/* Remove Button - only show when file is uploaded */}
        {currentFile && !isDefaultAvatar && (
          <Button
            size="icon"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            type="button"
            className="absolute end-0 top-0 size-6 rounded-full"
            aria-label="Remove avatar"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="space-y-0.5 text-center">
        <p className="text-sm font-medium">
          {currentFile && !isDefaultAvatar
            ? "Avatar uploaded"
            : "Upload avatar"}
        </p>
        <p className="text-muted-foreground text-xs">
          PNG, JPG up to {formatBytes(maxSize)}
        </p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" appearance="light" className="mt-5">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>File upload error(s)</AlertTitle>
            <AlertDescription>
              {errors.map((error, index) => (
                <p key={index} className="last:mb-0">
                  {error}
                </p>
              ))}
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}
    </div>
  );
}
