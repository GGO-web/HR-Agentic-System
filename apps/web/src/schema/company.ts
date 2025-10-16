import { z } from "zod";

export const companySchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters"),
  description: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
