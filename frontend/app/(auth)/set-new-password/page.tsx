"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { setNewPasswordFormSchema, type SetNewPasswordFormValues } from "@/lib/validations/auth";

export default function SetNewPasswordPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetNewPasswordFormValues>({ resolver: zodResolver(setNewPasswordFormSchema) });

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
        <Input label="New Password" type="password" {...register("newPassword")} error={errors.newPassword?.message} />
        <Input
          label="Confirm New Password"
          type="password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        {formError ? <p className="text-sm text-state-danger">{formError}</p> : null}

        <Button type="submit" loading={isSubmitting} className="w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}
