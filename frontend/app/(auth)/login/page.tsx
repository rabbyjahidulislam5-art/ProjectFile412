"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
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
      setFormError(error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold text-text-primary">Log in</h1>
        <p className="text-sm text-text-secondary">Welcome back to Smart Campus.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Student ID or Email" {...register("identifier")} error={errors.identifier?.message} />
        <Input
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />

        {formError ? <p className="text-sm text-state-danger">{formError}</p> : null}

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-xs text-accent-secondary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
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
