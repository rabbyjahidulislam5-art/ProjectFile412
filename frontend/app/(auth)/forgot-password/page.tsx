"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
import {
  forgotPasswordFormSchema,
  resetPasswordFormSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";

// Must match backend OTP_RESEND_COOLDOWN_SECONDS default.
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);

  const requestForm = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordFormSchema) });
  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (!identifier || cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [identifier, cooldown]);

  async function onRequestOtp(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      await apiRequest("/auth/forgot-password", { method: "POST", body: values });
      setIdentifier(values.identifier);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.");
    }
  }

  async function onResend() {
    if (!identifier || cooldown > 0) return;
    setResending(true);
    setFormError(null);
    try {
      await apiRequest("/auth/forgot-password", { method: "POST", body: { identifier } });
      toast({ title: "Code resent", description: "Check your inbox for a new reset code." });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      resetForm.setValue("otp", "");
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "Couldn't resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function onResetPassword(values: ResetPasswordFormValues) {
    if (!identifier) return;
    setFormError(null);
    try {
      await apiRequest("/auth/reset-password", { method: "POST", body: { identifier, ...values } });
      toast({ title: "Password reset", description: "You can now log in with your new password." });
      router.push("/login");
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.");
    }
  }

  if (identifier) {
    const newPassword = resetForm.watch("newPassword") ?? "";

    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-xl font-semibold text-text-primary">Enter reset code</h1>
          <p className="text-sm text-text-secondary">
            We sent a 6-digit code to <span className="text-text-primary">{identifier}</span>. It expires in 10
            minutes.
          </p>
        </div>

        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4" noValidate>
          <Controller
            control={resetForm.control}
            name="otp"
            render={({ field }) => (
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                error={resetForm.formState.errors.otp?.message}
                autoFocus
              />
            )}
          />
          <div>
            <PasswordInput
              label="New Password"
              autoComplete="new-password"
              {...resetForm.register("newPassword")}
              error={resetForm.formState.errors.newPassword?.message}
            />
            <PasswordStrengthMeter value={newPassword} />
          </div>
          <PasswordInput
            label="Confirm New Password"
            autoComplete="new-password"
            {...resetForm.register("confirmPassword")}
            error={resetForm.formState.errors.confirmPassword?.message}
          />

          {formError ? (
            <div className="flex items-start gap-2 rounded-control border border-state-danger/30 bg-state-danger/10 p-3 text-sm text-state-danger animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{formError}</p>
            </div>
          ) : null}

          <Button type="submit" loading={resetForm.formState.isSubmitting} className="w-full transition-transform active:scale-[0.98]">
            Reset Password
          </Button>
        </form>

        <div className="text-center text-sm text-text-secondary">
          Didn&apos;t get the code?{" "}
          {cooldown > 0 ? (
            <span>Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="font-medium text-accent-secondary hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>
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
          autoFocus
          {...requestForm.register("identifier")}
          error={requestForm.formState.errors.identifier?.message}
        />

        {formError ? (
          <div className="flex items-start gap-2 rounded-control border border-state-danger/30 bg-state-danger/10 p-3 text-sm text-state-danger animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{formError}</p>
          </div>
        ) : null}

        <Button type="submit" loading={requestForm.formState.isSubmitting} className="w-full transition-transform active:scale-[0.98]">
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
