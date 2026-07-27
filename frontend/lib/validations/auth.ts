import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

export const registerFormSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    studentId: z.string().trim().min(1, "Student ID is required"),
    department: z.string().trim().min(1, "Department is required"),
    batch: z.string().trim().min(1, "Batch is required"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().min(6, "Enter a valid phone number"),
    password,
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((v) => v, "You must accept the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  identifier: z.string().trim().min(1, "Student ID or email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotPasswordFormSchema = z.object({
  identifier: z.string().trim().min(1, "Student ID or email is required"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    otp: z.string().length(6, "Enter the 6-digit code"),
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
