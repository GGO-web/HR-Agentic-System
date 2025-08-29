import { z } from "zod"

export const verificationFormSchema = z.object({
  verificationCode: z
    .string()
    .regex(/^\d{6}$/, "Verification code must contain 6 digits"),
})
