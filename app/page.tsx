import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Zap,
  Bug,
  Globe,
  Image,
  BarChart2,
  CheckCircle2,
  Code2,
  Search,
  ChevronDown,
  Star,
  GitBranch,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";
import { HomeAiChat } from "@/components/landing/home-ai-chat";

// ─── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Bug,
    title: "AI Fix Engine",
    description:
      "Paste any broken code or error trace and get an instant root-cause analysis, complete fix, and side-by-side diff — powered by Llama 3.3 70B.",
    badge: "Most popular",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Globe,
    title: "Website & Repo Scanner",
    description:
      "Audit any live URL or GitHub repository for SEO gaps, security vulnerabilities, accessibility failures, and performance issues in one scan.",
    badge: null,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: Image,
    title: "Image → Code",
    description:
      "Upload a UI screenshot or design mockup and get production-ready React, Next.js, HTML, or Vue code — with component breakdown and explanation.",
    badge: "Vision AI",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Zap,
    title: "API Inspector",
    description:
      "Test any HTTP endpoint through a secure proxy, inspect headers, response time, and security issues, then export curl / fetch / axios snippets.",
    badge: null,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Shield,
    title: "Security Scanning",
    description:
      "Detect OWASP vulnerabilities, injection risks, missing security headers, and insecure patterns — with CWE references and actionable fixes.",
    badge: null,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: BarChart2,
    title: "Reports & History",
    description:
      "Every analysis is saved. Review trends, revisit past scans, and track your progress with interactive charts and an activity timeline.",
    badge: null,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
];

const steps = [
  {
    step: "01",
    title: "Choose a tool",
    description:
      "Pick from the AI Fix Engine, Site Scanner, Image-to-Code converter, or API Inspector — each purpose-built for a different workflow.",
  },
  {
    step: "02",
    title: "Paste or upload",
    description:
      "Drop in a code snippet, a URL, a screenshot, or an endpoint URL. No setup, no configuration, no credentials needed.",
  },
  {
    step: "03",
    title: "Get AI-powered results",
    description:
      "Receive scores, issues, fixes, and recommendations within seconds — fully explained and ready to copy or download.",
  },
];

const stats = [
  { label: "Languages supported", value: "12+" },
  { label: "Issue types detected", value: "50+" },
  { label: "Avg. response time", value: "< 3s" },
  { label: "Cost to start", value: "Free" },
];

const faqs = [
  {
    q: "Is CodeMedic AI free to use?",
    a: "Yes — CodeMedic AI is completely free. It runs on Groq's free inference tier, so there are no usage limits or credit cards required.",
  },
  {
    q: "Which languages are supported for code analysis?",
    a: "TypeScript, JavaScript, Python, Rust, Go, Java, C++, C#, PHP, Ruby, Swift, and Kotlin — with automatic language detection.",
  },
  {
    q: "Does my code get stored anywhere?",
    a: "Analyses are saved to your account so you can revisit them from the History page. Only your account can see your analyses.",
  },
  {
    q: "Can I scan private GitHub repositories?",
    a: "Currently only public repositories are supported for scanning. Private repo support is on the roadmap.",
  },
  {
    q: "How does the Image → Code feature work?",
    a: "We use Groq's vision model (Llama 4 Scout) to understand the UI layout in your screenshot and generate matching component code for the framework you choose.",
  },
  {
    q: "Is there a limit on code length?",
    a: "You can analyze up to 100,000 characters per submission, which covers most real-world files and snippets.",
  },
];

const languages = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go",
  "Java", "C++", "PHP", "Ruby", "Swift", "Kotlin", "C#",
];

const benefits = [
  { icon: Bug, title: "Instant root-cause", desc: "Know exactly why code breaks, not just that it does." },
  { icon: Shield, title: "Security-first", desc: "CWE-referenced vulnerabilities with concrete remediations." },
  { icon: GitBranch, title: "Repo-aware", desc: "Scan entire GitHub repos for quality, docs, and security gaps." },
  { icon: Search, title: "No false positives", desc: "AI context-awareness means fewer noisy alerts, more signal." },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 glass">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo size="md" />
            <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="#ai-assistant" className="hover:text-foreground transition-colors">AI Chat</Link>
              <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
              <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Sign in
              </Link>
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "sm" }), "gradient-primary text-white border-0")}
              >
                Get started <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center overflow-hidden min-h-[82vh] lg:min-h-screen">
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

        {/* Subtle overlay for text legibility */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(6,2,2,0.55) 0%, rgba(6,2,2,0.40) 55%, rgba(6,2,2,0.18) 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
          <Badge
            variant="outline"
            className="mb-6 border-white/25 bg-white/10 text-white px-4 py-1.5 text-xs font-medium backdrop-blur-sm"
          >
            <Star className="size-3 mr-1.5 fill-current" />
            Powered by Groq — ultra-fast AI inference
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-lg">
            Your AI-Powered{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #f87171 0%, #fb923c 60%, #fbbf24 100%)",
              }}
            >
              Dev Platform
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed drop-shadow">
            Fix bugs, scan websites, convert designs to code, and test APIs —
            all in one place, powered by state-of-the-art AI.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "gradient-primary text-white border-0 h-12 px-8 shadow-lg"
              )}
            >
              Start for free — no card needed
              <ArrowRight className="ml-2 size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg text-sm font-medium border border-white/35 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Sign in
            </Link>
          </div>

          {/* Language pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 max-w-2xl">
            {languages.map((lang) => (
              <span
                key={lang}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/65 backdrop-blur-sm"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <ChevronDown className="size-5 text-white" />
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/50">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center py-6 px-4 text-center">
                <span className="text-3xl font-extrabold text-foreground">{stat.value}</span>
                <span className="mt-1 text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Chatbot ───────────────────────────────────────────────────── */}
      <HomeAiChat />

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="px-4 py-14 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary text-xs">
              Everything you need
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Six tools. One platform.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">
              Every tool you need to build, debug, and ship better software — powered by the same AI backbone.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href="/signup"
                className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("inline-flex rounded-xl p-2.5", feature.bg)}>
                    <feature.icon className={cn("size-5", feature.color)} />
                  </div>
                  {feature.badge && (
                    <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Try it free <ArrowRight className="size-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 py-14 sm:px-6 lg:px-8 bg-muted/20 scroll-mt-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary text-xs">
              Simple by design
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              How it works
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">
              No setup. No config files. Just results in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 relative">
            {/* Connector line */}
            <div
              aria-hidden
              className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px border-t border-dashed border-border/60"
            />

            {steps.map((step) => (
              <div key={step.step} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6 flex size-20 items-center justify-center rounded-2xl border-2 border-primary/20 bg-card shadow-sm">
                  <span className="text-2xl font-extrabold text-primary">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo / Code Preview ──────────────────────────────────────────── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary text-xs">
              Live preview
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              See it in action
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Paste buggy code and get an explanation, fix, and diff — in under 3 seconds.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-[#0d0d0d] overflow-hidden shadow-2xl">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.03]">
              <div className="size-3 rounded-full bg-red-500/70" />
              <div className="size-3 rounded-full bg-yellow-500/70" />
              <div className="size-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-white/30 font-mono">codemedic-ai — analyze</span>
            </div>
            <div className="p-6 font-mono text-sm">
              <div className="text-white/30 text-xs mb-3">// Input: paste your broken code</div>
              <pre className="text-white/60 leading-relaxed overflow-x-auto text-xs sm:text-sm">
{`async function fetchUser(id) {
  const res = await fetch('/api/users/' + id)
  const data = res.json()   // ← forgot await
  return data.user
}`}
              </pre>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle2 className="size-3.5" />
                  <span>Analysis complete — 1 issue found</span>
                </div>
                <div className="rounded-lg bg-white/5 p-4 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-mono">WARN</span>
                    <span className="text-white/80 text-sm font-sans">Missing await on res.json()</span>
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed font-sans">
                    <code className="text-white/60">res.json()</code> returns a Promise. Without{" "}
                    <code className="text-white/60">await</code>, <code className="text-white/60">data</code> is a
                    Promise object, not the parsed JSON — <code className="text-white/60">data.user</code> will always
                    be <code className="text-white/60">undefined</code>.
                  </p>
                </div>
                <div className="rounded-lg overflow-hidden border border-white/10">
                  <div className="text-xs px-3 py-1.5 bg-white/[0.03] text-white/30 border-b border-white/5 flex items-center gap-1.5 font-sans">
                    <Code2 className="size-3" /> Fixed code
                  </div>
                  <div className="p-4 space-y-1 text-xs sm:text-sm">
                    <div className="text-red-400/60 line-through">{"  const data = res.json()"}</div>
                    <div className="text-green-400">{"  const data = await res.json()"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8 bg-muted/20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
            <div>
              <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary text-xs">
                Why CodeMedic AI
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-6">
                Ship faster.{" "}
                <span className="text-muted-foreground">Break less.</span>
                <br />Sleep better.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Stop spending hours debugging, manually auditing SEO, or hand-writing
                boilerplate. Let AI handle the tedious parts while you focus on what matters.
              </p>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gradient-primary text-white border-0 h-12 px-8"
                )}
              >
                Get started — it&apos;s free
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <b.icon className="size-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{b.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="px-4 py-14 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary text-xs">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Questions &amp; answers
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-card overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground cursor-pointer list-none hover:bg-muted/30 transition-colors select-none">
                  {faq.q}
                  <ChevronDown className="size-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-primary/5 p-10 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 50% 110%, oklch(0.55 0.24 264 / 0.35), transparent)",
            }}
          />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Ready to level up your workflow?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Free forever. No credit card. No install.
            </p>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 gradient-primary text-white border-0 h-12 px-10 shadow-lg shadow-primary/25"
              )}
            >
              Create your free account <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3 max-w-xs">
              <Logo size="md" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI-powered code analysis, site scanning, image-to-code, and API tooling — all in one free platform.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-3">Tools</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><Link href="/signup" className="hover:text-foreground transition-colors">AI Fix Engine</Link></li>
                  <li><Link href="/signup" className="hover:text-foreground transition-colors">Site Scanner</Link></li>
                  <li><Link href="/signup" className="hover:text-foreground transition-colors">Image → Code</Link></li>
                  <li><Link href="/signup" className="hover:text-foreground transition-colors">API Inspector</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-3">Account</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><Link href="/signup" className="hover:text-foreground transition-colors">Sign up free</Link></li>
                  <li><Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
                  <li><Link href="/forgot-password" className="hover:text-foreground transition-colors">Reset password</Link></li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="font-semibold text-foreground mb-3">Built with</p>
                <ul className="space-y-2 text-muted-foreground text-xs">
                  <li>Groq AI (inference)</li>
                  <li>Supabase (auth + DB)</li>
                  <li>Next.js 16</li>
                  <li>Tailwind CSS v4</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-border/50 flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} CodeMedic AI. All rights reserved.</p>
            <p>
              Built by{" "}
              <span className="font-semibold text-foreground">Shashi Thakur</span>
              {" "}·{" "}
              <span className="text-primary">Full Stack Developer</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
