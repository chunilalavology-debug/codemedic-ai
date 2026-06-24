import Link from "next/link";
import { ArrowRight, Shield, Zap, Bug, Clock, Upload, Copy } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const features = [
  {
    icon: Bug,
    title: "Error Analysis",
    description:
      "Paste any error or broken code and get an instant root-cause explanation with a complete fix.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: Shield,
    title: "Security Scanning",
    description:
      "Detect OWASP vulnerabilities, injection risks, and insecure patterns with CWE references.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Zap,
    title: "Performance Review",
    description:
      "Identify bottlenecks, N+1 queries, unnecessary re-renders, and get estimated gains.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Upload,
    title: "Repo Upload",
    description:
      "Upload entire files or repositories and get a holistic multi-file analysis in one pass.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Clock,
    title: "Analysis History",
    description:
      "Every analysis is saved. Search, revisit, and compare fixes across your entire history.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Copy,
    title: "One-click Copy",
    description:
      "Copy the fixed code with a single click. Diff view shows exactly what changed and why.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
];

const languages = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Rust",
  "Go",
  "Java",
  "C++",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "C#",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 glass">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Sign in
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({ size: "sm" }) + " gradient-primary text-white border-0"}
              >
                Get started <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-[100vh] flex-col items-center justify-center px-4 py-28 text-center overflow-hidden">

        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Overlay — dark gradient so text stays legible over the vivid red video */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(8,3,3,0.38) 0%, rgba(8,3,3,0.25) 55%, rgba(8,3,3,0.05) 100%)",
          }}
        />
        {/* Bottom fade to background */}
        <div
          aria-hidden
          className="absolute bottom-0 inset-x-0 h-32"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--background))",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          <Badge
            variant="outline"
            className="mb-6 border-white/20 bg-white/10 text-white px-4 py-1.5 backdrop-blur-md"
          >
            Powered by Groq AI
          </Badge>

          <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-lg">
            Your AI-Powered{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #f87171 0%, #fb923c 60%, #fbbf24 100%)",
              }}
            >
              Code Doctor
            </span>
          </h1>

          <p className="mt-5 text-base text-white/70 drop-shadow">
            Analyze errors, generate fixes, and ship better code — in seconds.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className={buttonVariants({ size: "lg" }) + " gradient-primary text-white border-0 h-12 px-8 shadow-lg"}
            >
              Start analyzing for free
              <ArrowRight className="ml-2 size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg text-sm font-medium border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 hover:border-white/60"
            >
              Sign in
            </Link>
          </div>

          {/* Language pills */}
          <div className="mt-14 flex flex-wrap justify-center gap-2 max-w-2xl">
            {languages.map((lang) => (
              <span
                key={lang}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70 backdrop-blur-sm"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to debug faster
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              One tool that covers the full diagnostic lifecycle — from error to
              production-ready fix.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:glow-primary"
              >
                <div className={`mb-4 inline-flex rounded-xl p-2.5 ${feature.bg}`}>
                  <feature.icon className={`size-5 ${feature.color}`} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-primary/5 p-12 text-center glow-primary">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Ready to fix your first bug?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Free to start. No credit card required.
          </p>
          <Link
            href="/signup"
            className={buttonVariants({ size: "lg" }) + " mt-8 gradient-primary text-white border-0 h-12 px-10"}
          >
            Get started free <ArrowRight className="ml-2 size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CodeMedic AI. Built with Claude AI.
          </p>
          <p className="text-xs text-muted-foreground">
            Made by{" "}
            <span className="font-semibold text-foreground">Shashi Thakur</span>
            {" "}·{" "}
            <span className="text-primary">Full Stack Developer</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
