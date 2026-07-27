"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { registerFormSchema, type RegisterFormValues } from "@/lib/validations/auth";
import type { AuthUser } from "@/types/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { termsAccepted: false },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      await apiRequest<{ user: AuthUser }>("/auth/register", { method: "POST", body: values });
      // Registration is students-only, so the destination is never ambiguous.
      router.push("/student");
      router.refresh();
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
        <Input label="Full Name" {...register("fullName")} error={errors.fullName?.message} />
        <Input label="Student ID" {...register("studentId")} error={errors.studentId?.message} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Department" {...register("department")} error={errors.department?.message} />
          <Input label="Batch" {...register("batch")} error={errors.batch?.message} />
        </div>
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Phone" type="tel" {...register("phone")} error={errors.phone?.message} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />
          <Input
            label="Confirm Password"
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-text-secondary">
          <input type="checkbox" className="mt-0.5 accent-accent-primary" {...register("termsAccepted")} />
          I agree to the Terms of Service and Privacy Policy.
        </label>
        {errors.termsAccepted ? <p className="text-sm text-state-danger">{errors.termsAccepted.message}</p> : null}

        {formError ? <p className="text-sm text-state-danger">{formError}</p> : null}

        <Button type="submit" loading={isSubmitting} className="w-full">
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
