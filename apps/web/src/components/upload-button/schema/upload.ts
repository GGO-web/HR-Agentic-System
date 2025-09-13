import { z } from "zod"

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/constants/s3"

export const uploadImageSchema = z.object({
  image: z
    //Rest of validations done via react dropzone
    .instanceof(File)
    .refine((file) => file.size !== 0, "Please upload an image")
    .refine(
      (file) => ALLOWED_IMAGE_TYPES.includes(file.type),
      "Unsupported file type",
    )
    .refine((file) => file.size <= MAX_IMAGE_SIZE, "File is too large"),
})

export type UploadImageSchema = z.infer<typeof uploadImageSchema>
