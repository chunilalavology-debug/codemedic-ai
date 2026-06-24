import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[500px] opacity-20 dark:opacity-15"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -5%, oklch(0.55 0.24 264 / 0.5), transparent)",
        }}
      />

      <header className="relative z-10 flex h-16 items-center justify-between px-6">
        <Link href="/">
          <Logo size="md" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
