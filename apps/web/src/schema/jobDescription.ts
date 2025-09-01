import { z } from "zod"

export const jobDescriptionSchema = z.object({
  title: z
    .string()
    .min(1, "Job title is required")
    .max(100, "Job title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Job description must be at least 10 characters")
    .max(2000, "Job description must be less than 2000 characters"),
})

export type JobDescriptionFormData = z.infer<typeof jobDescriptionSchema>
