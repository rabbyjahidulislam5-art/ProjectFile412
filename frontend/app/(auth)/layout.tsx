import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" className="font-display text-lg font-semibold tracking-tight text-text-primary">
        Smart Campus
      </Link>
      <div className="w-full max-w-sm rounded-card border border-border-subtle bg-bg-surface p-6 shadow-soft sm:p-8">
        {children}
      </div>
    </div>
  );
}
