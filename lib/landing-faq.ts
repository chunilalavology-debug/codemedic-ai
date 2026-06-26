export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  keywords?: string[];
}

export const LANDING_FAQ: FaqItem[] = [
  {
    id: "free",
    question: "Is CodeMedic AI free?",
    answer:
      "Yes — CodeMedic AI is free to start. It runs on Groq's fast inference tier, so you can analyze code, scan sites, and use AI tools without a credit card.",
    keywords: ["free", "cost", "price", "paid"],
  },
  {
    id: "languages",
    question: "Which languages are supported?",
    answer:
      "TypeScript, JavaScript, Python, Rust, Go, Java, C++, C#, PHP, Ruby, Swift, and Kotlin — with automatic language detection.",
    keywords: ["language", "typescript", "python", "java"],
  },
  {
    id: "storage",
    question: "Is my code stored?",
    answer:
      "Analyses are saved to your account so you can revisit them in History. Only you (and your workspace members, if shared) can access your data.",
    keywords: ["store", "privacy", "data", "save"],
  },
  {
    id: "github",
    question: "Can I scan GitHub repos?",
    answer:
      "Yes — paste any public GitHub or GitLab repo URL in the Site & Repo Scanner. Private repo support is coming soon.",
    keywords: ["github", "gitlab", "repo", "scan"],
  },
  {
    id: "image",
    question: "How does Image → Code work?",
    answer:
      "Upload a UI screenshot and our vision AI (Llama 4 Scout) generates React, Next.js, HTML, Vue, or Tailwind code matching your design.",
    keywords: ["image", "screenshot", "design", "figma"],
  },
  {
    id: "limit",
    question: "Is there a code size limit?",
    answer:
      "You can analyze up to 100,000 characters per submission — enough for most real-world files and snippets.",
    keywords: ["limit", "size", "length", "max"],
  },
  {
    id: "signup",
    question: "How do I get started?",
    answer:
      "Click Get started, create a free account, and open the dashboard. Try Code Analyzer or Site Scanner from the sidebar — results appear in seconds.",
    keywords: ["start", "signup", "register", "begin"],
  },
  {
    id: "tools",
    question: "What tools are included?",
    answer:
      "Code Analyzer, Site & Repo Scanner, Image-to-Code, API Inspector, CI/CD Checker, History, Reports, Workspaces, and an AI assistant — all in one dashboard.",
    keywords: ["tools", "features", "include"],
  },
  {
    id: "ai",
    question: "Which AI model powers this?",
    answer:
      "CodeMedic AI uses Groq with Llama 3.3 70B for text tasks and Llama 4 Scout for vision. You can change models in Settings.",
    keywords: ["groq", "llama", "model", "ai"],
  },
  {
    id: "security",
    question: "Is it secure for production code?",
    answer:
      "Your data is protected with Supabase auth and row-level security. Never share API keys in code — use environment variables. We flag secrets in scans when detected.",
    keywords: ["secure", "security", "safe", "production"],
  },
];

export function findFaqMatch(query: string): FaqItem | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const exact = LANDING_FAQ.find((item) => item.question.toLowerCase() === q);
  if (exact) return exact;

  const keywordHit = LANDING_FAQ.find((item) =>
    item.keywords?.some((kw) => q.includes(kw))
  );
  if (keywordHit) return keywordHit;

  const partial = LANDING_FAQ.find(
    (item) =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q)
  );
  return partial ?? null;
}
