"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { loginFormSchema, type LoginFormValues } from "@/lib/validations/auth";
import { roleHome } from "@/lib/role-home";
import type { AuthUser } from "@/types/auth";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendSent, setResendSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    setUnverifiedEmail(null);
    setResendSent(false);
    try {
      const { user } = await apiRequest<{ user: AuthUser }>("/auth/login", {
        method: "POST",
        body: values,
      });

      if (user.mustResetPassword) {
        router.push("/set-new-password");
        return;
      }

      router.push(searchParams.get("redirectTo") ?? roleHome(user.role) ?? "/");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        const details = error.details as { reason?: string; email?: string } | undefined;
        if (error.status === 403 && details?.reason === "email_not_verified" && details.email) {
          setUnverifiedEmail(details.email);
          setFormError(null);
          return;
        }
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  async function resendVerification() {
    if (!unverifiedEmail) return;
    try {
      await apiRequest("/auth/verify-email/resend", { method: "POST", body: { email: unverifiedEmail } });
      setResendSent(true);
    } catch {
      // Resend failures are non-critical here — the user can still navigate to
      // /verify-email and try again from there.
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold text-text-primary">Log in</h1>
        <p className="text-sm text-text-secondary">Welcome back to Smart Campus.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Student ID or Email"
          autoComplete="username"
          autoFocus
          {...register("identifier")}
          error={errors.identifier?.message}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          {...register("password")}
          error={errors.password?.message}
        />

        {formError ? (
          <div className="flex items-start gap-2 rounded-control border border-state-danger/30 bg-state-danger/10 p-3 text-sm text-state-danger animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{formError}</p>
          </div>
        ) : null}

        {unverifiedEmail ? (
          <div className="flex items-start gap-2 rounded-control border border-state-warning/30 bg-state-warning/10 p-3 text-sm text-text-primary animate-in fade-in slide-in-from-top-1">
            <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-state-warning" />
            <div className="space-y-1">
              <p>Please verify your email before logging in.</p>
              {resendSent ? (
                <p className="text-xs text-state-success">Verification code resent — check your inbox.</p>
              ) : (
                <button
                  type="button"
                  onClick={resendVerification}
                  className="text-xs font-medium text-accent-secondary hover:underline"
                >
                  Resend verification code
                </button>
              )}
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="block text-xs font-medium text-accent-secondary hover:underline"
              >
                Enter verification code
              </Link>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-xs text-accent-secondary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full transition-transform active:scale-[0.98]">
          Log In
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent-secondary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
