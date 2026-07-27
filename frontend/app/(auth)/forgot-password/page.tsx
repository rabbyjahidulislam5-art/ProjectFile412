"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import {
  forgotPasswordFormSchema,
  resetPasswordFormSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const requestForm = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordFormSchema) });
  const resetForm = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordFormSchema) });

  async function onRequestOtp(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      await apiRequest("/auth/forgot-password", { method: "POST", body: values });
      setIdentifier(values.identifier);
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.");
    }
  }

  async function onResetPassword(values: ResetPasswordFormValues) {
    if (!identifier) return;
    setFormError(null);
    try {
      await apiRequest("/auth/reset-password", { method: "POST", body: { identifier, ...values } });
      router.push("/login");
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.");
    }
  }

  if (identifier) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-xl font-semibold text-text-primary">Enter reset code</h1>
          <p className="text-sm text-text-secondary">
            We sent a 6-digit code for <span className="text-text-primary">{identifier}</span>. It expires in 10
            minutes.
          </p>
        </div>

        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4" noValidate>
          <Input
            label="6-Digit Code"
            inputMode="numeric"
            maxLength={6}
            {...resetForm.register("otp")}
            error={resetForm.formState.errors.otp?.message}
          />
          <Input
            label="New Password"
            type="password"
            {...resetForm.register("newPassword")}
            error={resetForm.formState.errors.newPassword?.message}
          />
          <Input
            label="Confirm New Password"
            type="password"
            {...resetForm.register("confirmPassword")}
            error={resetForm.formState.errors.confirmPassword?.message}
          />

          {formError ? <p className="text-sm text-state-danger">{formError}</p> : null}

          <Button type="submit" loading={resetForm.formState.isSubmitting} className="w-full">
            Reset Password
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold text-text-primary">Forgot password</h1>
        <p className="text-sm text-text-secondary">Enter your Student ID or email to receive a reset code.</p>
      </div>

      <form onSubmit={requestForm.handleSubmit(onRequestOtp)} className="space-y-4" noValidate>
        <Input
          label="Student ID or Email"
          {...requestForm.register("identifier")}
          error={requestForm.formState.errors.identifier?.message}
        />

        {formError ? <p className="text-sm text-state-danger">{formError}</p> : null}

        <Button type="submit" loading={requestForm.formState.isSubmitting} className="w-full">
          Send Reset Code
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Remembered it?{" "}
        <Link href="/login" className="text-accent-secondary hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
