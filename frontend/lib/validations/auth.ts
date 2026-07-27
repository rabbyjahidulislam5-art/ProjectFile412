import { z } from "zod";

// Must match backend/src/config/env.ts STUDENT_EMAIL_DOMAIN.
export const STUDENT_EMAIL_DOMAIN = "std.ewubd.edu";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

const otp = z
  .string()
  .trim()
  .length(6, "Enter the 6-digit code")
  .regex(/^\d{6}$/, "Code must be 6 digits");

export const registerFormSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    studentId: z.string().trim().min(1, "Student ID is required"),
    department: z.string().trim().min(1, "Department is required"),
    batch: z.string().trim().min(1, "Batch is required"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    phone: z.string().trim().min(6, "Enter a valid phone number"),
    password,
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((v) => v, "You must accept the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.email.endsWith(`@${STUDENT_EMAIL_DOMAIN}`), {
    message: `Email must be a university address (@${STUDENT_EMAIL_DOMAIN})`,
    path: ["email"],
  })
  .refine((data) => (data.email.split("@")[0] ?? "").toLowerCase() === data.studentId.toLowerCase(), {
    message: "Email must match your Student ID",
    path: ["email"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  identifier: z.string().trim().min(1, "Student ID or email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const verifyEmailFormSchema = z.object({
  otp,
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailFormSchema>;

export const forgotPasswordFormSchema = z.object({
  identifier: z.string().trim().min(1, "Student ID or email is required"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    otp,
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export const setNewPasswordFormSchema = z
  .object({
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetNewPasswordFormValues = z.infer<typeof setNewPasswordFormSchema>;

export function passwordStrength(value: string): { score: number; label: string } {
  const checks = [value.length >= 8, /[A-Z]/.test(value), /[a-z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)];
  const score = checks.filter(Boolean).length;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score] ?? "Very weak" };
}
