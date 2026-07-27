"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { registerFormSchema, STUDENT_EMAIL_DOMAIN, type RegisterFormValues } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { termsAccepted: false },
    mode: "onChange",
  });

  const password = watch("password") ?? "";
  const confirmPassword = watch("confirmPassword") ?? "";
  const studentId = watch("studentId") ?? "";
  const email = watch("email") ?? "";

  const emailLocalPart = email.split("@")[0]?.toLowerCase() ?? "";
  const idMatchesEmail = studentId.length > 0 && email.includes("@") && emailLocalPart === studentId.toLowerCase();
  const showMatchIndicator = studentId.length > 0 && email.includes("@");
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      await apiRequest<{ email: string; fullName: string }>("/auth/register", { method: "POST", body: values });
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold text-text-primary">Create your account</h1>
        <p className="text-sm text-text-secondary">Students only — staff accounts are provisioned by Admin Office.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Full Name" autoComplete="name" autoFocus {...register("fullName")} error={errors.fullName?.message} />
        <Input label="Student ID" {...register("studentId")} error={errors.studentId?.message} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Department" {...register("department")} error={errors.department?.message} />
          <Input label="Batch" {...register("batch")} error={errors.batch?.message} />
        </div>
        <div>
          <Input
            label={`University Email (@${STUDENT_EMAIL_DOMAIN})`}
            type="email"
            autoComplete="email"
            {...register("email")}
            error={errors.email?.message}
          />
          {showMatchIndicator && !errors.email ? (
            <div
              className={cn(
                "mt-1.5 flex items-center gap-1.5 text-xs animate-in fade-in",
                idMatchesEmail ? "text-state-success" : "text-state-danger",
              )}
            >
              {idMatchesEmail ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {idMatchesEmail ? "Student ID matches email" : "Email must start with your Student ID"}
            </div>
          ) : null}
        </div>
        <Input label="Phone" type="tel" autoComplete="tel" {...register("phone")} error={errors.phone?.message} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <PasswordInput
              label="Password"
              autoComplete="new-password"
              {...register("password")}
              error={errors.password?.message}
            />
            <PasswordStrengthMeter value={password} />
          </div>
          <div>
            <PasswordInput
              label="Confirm Password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
            {confirmPassword.length > 0 && !errors.confirmPassword ? (
              <div
                className={cn(
                  "mt-1.5 flex items-center gap-1.5 text-xs animate-in fade-in",
                  passwordsMatch ? "text-state-success" : "text-state-danger",
                )}
              >
                {passwordsMatch ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {passwordsMatch ? "Passwords match" : "Passwords don't match yet"}
              </div>
            ) : null}
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-text-secondary">
          <input type="checkbox" className="mt-0.5 accent-accent-primary" {...register("termsAccepted")} />
          I agree to the Terms of Service and Privacy Policy.
        </label>
        {errors.termsAccepted ? <p className="text-sm text-state-danger">{errors.termsAccepted.message}</p> : null}

        {formError ? (
          <div className="flex items-start gap-2 rounded-control border border-state-danger/30 bg-state-danger/10 p-3 text-sm text-state-danger animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{formError}</p>
          </div>
        ) : null}

        <Button type="submit" loading={isSubmitting} className="w-full transition-transform active:scale-[0.98]">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-secondary hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
