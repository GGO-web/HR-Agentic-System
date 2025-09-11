import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { ImagePlus } from "lucide-react"
import React from "react"
import { useDropzone } from "react-dropzone"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { uploadImageSchema, type UploadImageSchema } from "./schema/upload"

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/constants/s3"

interface ImageUploaderProps {
  defaultPreview?: string | ArrayBuffer | null
  onUpload: (file: File) => void
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  defaultPreview,
  onUpload,
}) => {
  const { t } = useTranslation()

  const [preview, setPreview] = React.useState<string | ArrayBuffer | null>(
    defaultPreview ?? null,
  )

  const form = useForm<UploadImageSchema>({
    resolver: zodResolver(uploadImageSchema),
    mode: "onBlur",
    defaultValues: {
      image: new File([""], "filename"),
    },
  })

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
    [form],
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      maxSize: MAX_IMAGE_SIZE,
      accept: Object.fromEntries(ALLOWED_IMAGE_TYPES.map((type) => [type, []])),
    })

  const onSubmit = (values: UploadImageSchema) => {
    onUpload(values.image)
    toast.success(
      `${t("uploadButton.uploadImageSuccess")} ${values.image.name}`,
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem className="mx-auto md:w-1/2">
              <FormLabel
                className={`${
                  fileRejections.length !== 0 && "text-destructive"
                }`}
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
                  className="border-foreground mx-auto flex cursor-pointer flex-col items-center justify-center gap-y-2 rounded-lg border border-dashed p-4 shadow-lg"
                >
                  {preview && (
                    <img
                      src={preview as string}
                      alt="Uploaded image"
                      className="w-30 rounded-lg"
                    />
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
                {fileRejections.length !== 0 && (
                  <p>{t("uploadButton.warning")}</p>
                )}
              </FormMessage>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
