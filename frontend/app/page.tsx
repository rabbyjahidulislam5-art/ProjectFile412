import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { roleHome } from "@/lib/role-home";

export default async function LandingPage() {
  // Middleware can only see whether a session cookie exists, not the role it
  // carries — so the role-aware hand-off happens here, where the user is known.
  const user = await getCurrentUser();
  if (user) {
    if (user.mustResetPassword) redirect("/set-new-password");
    const home = roleHome(user.role);
    if (home) redirect(home);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-accent-secondary">Smart Campus</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
          One wallet for everything on campus.
        </h1>
        <p className="mx-auto max-w-md text-sm text-text-secondary sm:text-base">
          Pay at campus shops, settle dues and fines, and manage your student wallet — all in one place.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <Button asChild size="default">
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild variant="secondary" size="default">
          <Link href="/register">Create Account</Link>
        </Button>
      </div>
    </div>
  );
}
