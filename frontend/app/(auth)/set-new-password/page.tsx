"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { setNewPasswordFormSchema, type SetNewPasswordFormValues } from "@/lib/validations/auth";

export default function SetNewPasswordPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SetNewPasswordFormValues>({ resolver: zodResolver(setNewPasswordFormSchema) });

  const newPassword = watch("newPassword") ?? "";

  async function onSubmit(values: SetNewPasswordFormValues) {
    setFormError(null);
    try {
      await apiRequest("/auth/change-password", { method: "PATCH", body: values });
      // The landing page forwards to whichever home matches this account's role.
      router.push("/");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold text-text-primary">Set a new password</h1>
        <p className="text-sm text-text-secondary">
          Your account was provisioned with a temporary password. Set a new one to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <PasswordInput
            label="New Password"
            autoComplete="new-password"
            autoFocus
            {...register("newPassword")}
            error={errors.newPassword?.message}
          />
          <PasswordStrengthMeter value={newPassword} />
        </div>
        <PasswordInput
          label="Confirm New Password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        {formError ? (
          <div className="flex items-start gap-2 rounded-control border border-state-danger/30 bg-state-danger/10 p-3 text-sm text-state-danger animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{formError}</p>
          </div>
        ) : null}

        <Button type="submit" loading={isSubmitting} className="w-full transition-transform active:scale-[0.98]">
          Continue
        </Button>
      </form>
    </div>
  );
}
