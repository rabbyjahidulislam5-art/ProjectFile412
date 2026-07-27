import { z } from "zod";

// Only the phone number is student-editable. Name, Student ID, Department and
// Batch originate at registration and require a staff-side correction
// (Module 1 §3.10 business logic).
export const updateStudentProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number")
    .max(20, "Enter a valid phone number")
    .regex(/^[+0-9][0-9\s-]*$/, "Enter a valid phone number"),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
