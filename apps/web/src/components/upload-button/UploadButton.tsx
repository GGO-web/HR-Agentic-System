import { Button } from "@workspace/ui/components/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { ImagePlus, X } from "lucide-react"
import React from "react"
import { useDropzone } from "react-dropzone"
import { useFormContext } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/constants/s3"

interface UploadButtonProps {
  defaultPreview?: string | ArrayBuffer | null
  onUpload: (file: File) => void
  onRemove?: () => void | Promise<void>
}

export const UploadButtton: React.FC<UploadButtonProps> = ({
  defaultPreview,
  onUpload,
  onRemove,
}) => {
  const { t } = useTranslation()

  const [preview, setPreview] = React.useState<string | ArrayBuffer | null>(
    defaultPreview ?? null,
  )

  const form = useFormContext()

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles[0]) return

      const reader = new FileReader()
      try {
        reader.onload = () => setPreview(reader.result)
        reader.readAsDataURL(acceptedFiles[0])
        form.setValue("image", acceptedFiles[0])
        form.clearErrors("image")

        onUpload(acceptedFiles[0])
      } catch (error) {
        console.error(error)
        setPreview(null)
        form.resetField("image")
      }
    },
    [form, onUpload],
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      maxSize: MAX_IMAGE_SIZE,
      accept: Object.fromEntries(ALLOWED_IMAGE_TYPES.map((type) => [type, []])),
    })

  const handleRemoveImage = async () => {
    try {
      if (onRemove) {
        await onRemove()
      }
      setPreview(null)

      toast.success(t("uploadButton.removeImage.success"))
    } catch (error) {
      console.error(error)
      toast.error(t("uploadButton.removeImage.error"))
    }
  }

  return (
    <FormField
      control={form.control}
      name="image"
      render={() => (
        <FormItem className="mx-auto md:w-1/2">
          <FormLabel
            className={`${fileRejections.length !== 0 && "text-destructive"}`}
          >
            <span
              className={
                form.formState.errors.image || fileRejections.length !== 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              }
            ></span>
          </FormLabel>

          <FormControl>
            <div
              {...getRootProps()}
              className="border-foreground group relative mx-auto flex cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg border border-dashed p-4 shadow-lg"
            >
              {preview && (
                <>
                  <img
                    src={preview as string}
                    alt="Uploaded image"
                    className="w-30 rounded-lg"
                  />

                  {onRemove && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-red-500 p-2 hover:bg-red-600"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await handleRemoveImage()
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}

              <ImagePlus
                className={`size-20 ${preview ? "hidden" : "block"}`}
              />
              <Input {...getInputProps()} type="file" />

              <p className="m-0 text-sm">
                <Trans
                  i18nKey={
                    isDragActive
                      ? "uploadButton.dropImage"
                      : "uploadButton.clickHereOrDragImage"
                  }
                  components={{ b: <b /> }}
                />
              </p>
            </div>
          </FormControl>

          <FormMessage>
            {fileRejections.length !== 0 && <p>{t("uploadButton.warning")}</p>}
          </FormMessage>
        </FormItem>
      )}
    />
  )
}
