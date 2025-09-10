import { z } from "zod"

export const uploadImageSchema = z.object({
  image: z
    //Rest of validations done via react dropzone
    .instanceof(File)
    .refine((file) => file.size !== 0, "Please upload an image"),
})

export type UploadImageSchema = z.infer<typeof uploadImageSchema>
