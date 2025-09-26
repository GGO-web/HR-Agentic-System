import { z } from "zod"

export const inviteCandidateSchema = z.object({
  candidateEmail: z.string().email("Invalid email address"),
  message: z.string().optional(),
})

export type InviteCandidateFormData = z.infer<typeof inviteCandidateSchema>
