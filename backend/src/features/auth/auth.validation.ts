import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

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
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Student ID or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1, "Student ID or email is required"),
});

export const resetPasswordSchema = z
  .object({
    identifier: z.string().trim().min(1),
    otp: z.string().length(6, "OTP must be 6 digits"),
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
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
