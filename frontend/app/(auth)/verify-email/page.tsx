"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";

// Must match backend OTP_RESEND_COOLDOWN_SECONDS default.
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/auth/verify-email", { method: "POST", body: { email, otp } });
      toast({ title: "Email verified", description: "Your account is now active — please log in." });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (cooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      await apiRequest("/auth/verify-email/resend", { method: "POST", body: { email } });
      toast({ title: "Code resent", description: "Check your inbox for a new verification code." });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-secondary/10">
          <MailCheck className="h-5 w-5 text-accent-secondary" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-xl font-semibold text-text-primary">Verify your email</h1>
          <p className="text-sm text-text-secondary">
            We sent a 6-digit code to{" "}
            <span className="text-text-primary">{email || "your university email"}</span>. It expires in 10 minutes.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <OtpInput value={otp} onChange={setOtp} error={error ?? undefined} disabled={submitting} autoFocus />

        {error ? (
          <div className="flex items-start gap-2 rounded-control border border-state-danger/30 bg-state-danger/10 p-3 text-sm text-state-danger animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        <Button type="submit" loading={submitting} className="w-full transition-transform active:scale-[0.98]">
          Verify Email
        </Button>
      </form>

      <div className="text-center text-sm text-text-secondary">
        Didn&apos;t get the code?{" "}
        {cooldown > 0 ? (
          <span className="text-text-secondary">Resend in {cooldown}s</span>
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

      <p className="text-center text-sm text-text-secondary">
        Wrong account?{" "}
        <Link href="/register" className="text-accent-secondary hover:underline">
          Register again
        </Link>
      </p>
    </div>
  );
}
