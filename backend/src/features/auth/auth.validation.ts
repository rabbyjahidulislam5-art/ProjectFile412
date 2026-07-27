import { z } from "zod";
import { env } from "../../config/env";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

const otp = z
  .string()
  .trim()
  .length(6, "Enter the 6-digit code")
  .regex(/^\d{6}$/, "Code must be 6 digits");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(150),
    studentId: z.string().trim().min(1).max(20),
    department: z.string().trim().min(1).max(100),
    batch: z.string().trim().min(1).max(20),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(6).max(20),
    password,
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to register" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.email.endsWith(`@${env.STUDENT_EMAIL_DOMAIN}`), {
    message: `Email must be a university address (@${env.STUDENT_EMAIL_DOMAIN})`,
    path: ["email"],
  })
  .refine((data) => (data.email.split("@")[0] ?? "").toLowerCase() === data.studentId.toLowerCase(), {
    message: "Email must match your Student ID (e.g. 2023-2-60-053@std.ewubd.edu)",
    path: ["email"],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Student ID or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp,
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1, "Student ID or email is required"),
});

export const resetPasswordSchema = z
  .object({
    identifier: z.string().trim().min(1),
    otp,
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    // Optional at the schema level only: the service requires it for a
    // voluntary change (Module 1 §3.10) and waives it for the forced first-login
    // reset, where the account has no password the user chose yet.
    currentPassword: z.string().min(1).optional(),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
