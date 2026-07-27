import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-bg-primary px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, rgba(201,162,39,0.12), transparent 60%), radial-gradient(500px circle at 100% 100%, rgba(46,210,196,0.08), transparent 60%)",
        }}
      />
      <Link
        href="/"
        className="relative font-display text-lg font-semibold tracking-tight text-text-primary transition-opacity hover:opacity-80 animate-in fade-in slide-in-from-top-2 duration-500"
      >
        Smart Campus
      </Link>
      <div className="relative w-full max-w-sm rounded-card border border-border-subtle bg-bg-surface p-6 shadow-soft animate-in fade-in slide-in-from-bottom-3 duration-500 sm:p-8">
        {children}
      </div>
    </div>
  );
}
