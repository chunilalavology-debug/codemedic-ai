import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import Groq from "groq-sdk";
import { v4 as uuidv4 } from "uuid";
import type { ScanResult, ScanIssue, SeoMetrics, ScanScores } from "@/types";

const MODEL = "llama-3.3-70b-versatile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type = "website" } = body as { url: string; type?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    if (type === "github") {
      const result = await scanGitHubRepo(normalizedUrl);
      return NextResponse.json({ success: true, data: result });
    }

    const result = await scanWebsite(normalizedUrl);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── Website Scanner ───────────────────────────────────────────────────────────

async function scanWebsite(url: string): Promise<ScanResult> {
  let html = "";
  let fetchError = "";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 CodeMedic-Scanner/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    html = await res.text();
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Could not fetch URL";
  }

  const seoMetrics = html ? extractSeoMetrics(html, url) : null;
  const issues: ScanIssue[] = html ? extractWebsiteIssues(html, seoMetrics) : [];

  if (fetchError) {
    issues.push({
      id: "CONN-001",
      category: "broken",
      severity: "critical",
      title: "Site Unreachable",
      description: fetchError,
      recommendation: "Verify the URL is correct and the server is online.",
    });
  }

  const aiAnalysis = await analyzeWithGroq("website", url, html.slice(0, 6000), seoMetrics, issues);

  return {
    id: uuidv4(),
    url,
    type: "website",
    title: seoMetrics?.title ?? new URL(url).hostname,
    scores: aiAnalysis.scores,
    issues: [...issues, ...aiAnalysis.extraIssues],
    seoMetrics: seoMetrics ?? undefined,
    summary: aiAnalysis.summary,
    recommendations: aiAnalysis.recommendations,
    createdAt: new Date().toISOString(),
  };
}

function extractSeoMetrics(html: string, _url: string): SeoMetrics {
  const $ = cheerio.load(html);

  const headings: { level: number; text: string }[] = [];
  $("h1,h2,h3,h4").each((_, el) => {
    headings.push({
      level: parseInt((el as { tagName: string }).tagName.slice(1)),
      text: $(el).text().trim().slice(0, 120),
    });
  });

  const images: { src: string; hasAlt: boolean }[] = [];
  $("img").each((_, el) => {
    images.push({
      src: $(el).attr("src") ?? "",
      hasAlt: !!($(el).attr("alt") ?? "").trim(),
    });
  });

  const linkCount = $("a[href]").length;
  const wordCount = $("body").text().trim().split(/\s+/).filter(Boolean).length;

  return {
    title: $("title").first().text().trim() || null,
    description: $('meta[name="description"]').attr("content") ?? null,
    hasViewport: !!$('meta[name="viewport"]').length,
    hasCanonical: !!$('link[rel="canonical"]').length,
    hasRobots: !!$('meta[name="robots"]').length,
    hasSitemap: null,
    hasOpenGraph: !!$('meta[property^="og:"]').length,
    hasTwitterCard: !!$('meta[name^="twitter:"]').length,
    hasStructuredData: !!$('script[type="application/ld+json"]').length,
    headings,
    images,
    linkCount,
    wordCount,
  };
}

function extractWebsiteIssues(html: string, seo: SeoMetrics | null): ScanIssue[] {
  const issues: ScanIssue[] = [];
  if (!seo) return issues;

  if (!seo.title) issues.push({ id: "SEO-001", category: "seo", severity: "high", title: "Missing Page Title", description: "No <title> tag found.", recommendation: "Add a descriptive <title> tag (50-60 chars).", });
  if (!seo.description) issues.push({ id: "SEO-002", category: "seo", severity: "high", title: "Missing Meta Description", description: "No meta description found.", recommendation: "Add a meta description (120-160 chars).", });
  if (!seo.hasViewport) issues.push({ id: "ACC-001", category: "accessible", severity: "high", title: "Missing Viewport Meta Tag", description: "No viewport meta tag — site may not be mobile-friendly.", recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.', } as ScanIssue);
  if (!seo.hasOpenGraph) issues.push({ id: "SEO-003", category: "seo", severity: "medium", title: "Missing Open Graph Tags", description: "No OG tags found. Social previews will be generic.", recommendation: "Add og:title, og:description, og:image meta tags.", });
  if (!seo.hasCanonical) issues.push({ id: "SEO-004", category: "seo", severity: "low", title: "Missing Canonical URL", description: "No canonical link tag found.", recommendation: 'Add <link rel="canonical" href="..."> to prevent duplicate content.', });
  if (!seo.hasStructuredData) issues.push({ id: "SEO-005", category: "seo", severity: "low", title: "No Structured Data", description: "No JSON-LD or schema.org markup detected.", recommendation: "Add structured data to improve rich search results.", });

  const missingAlt = seo.images.filter((i) => !i.hasAlt).length;
  if (missingAlt > 0) issues.push({ id: "ACC-002", category: "accessibility", severity: missingAlt > 5 ? "high" : "medium", title: `${missingAlt} Image${missingAlt > 1 ? "s" : ""} Missing Alt Text`, description: `${missingAlt} image element${missingAlt > 1 ? "s" : ""} have no alt attribute.`, recommendation: "Add descriptive alt attributes to all images.", });

  const h1Count = seo.headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) issues.push({ id: "SEO-006", category: "seo", severity: "high", title: "Missing H1 Heading", description: "No H1 heading found on the page.", recommendation: "Add a single descriptive H1 heading.", });
  if (h1Count > 1) issues.push({ id: "SEO-007", category: "seo", severity: "medium", title: "Multiple H1 Headings", description: `Found ${h1Count} H1 tags. Pages should have exactly one H1.`, recommendation: "Keep only one H1 and use H2-H6 for sub-sections.", });

  const $ = cheerio.load(html);
  const externalLinks = $("a[href]").filter((_, el) => {
    const href = $(el).attr("href") ?? "";
    return href.startsWith("http");
  });
  const noRelLinks = externalLinks.filter((_, el) => !$(el).attr("rel")?.includes("noopener")).length;
  if (noRelLinks > 0) issues.push({ id: "SEC-001", category: "security", severity: "medium", title: `${noRelLinks} External Links Missing rel="noopener"`, description: "External links without noopener can expose your site to tab-napping attacks.", recommendation: 'Add rel="noopener noreferrer" to all external links.', });

  return issues;
}

// ── GitHub Repo Scanner ───────────────────────────────────────────────────────

async function scanGitHubRepo(url: string): Promise<ScanResult> {
  const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) throw new Error("Invalid GitHub repository URL");
  const [, owner, repo] = match;

  const headers: HeadersInit = { Accept: "application/vnd.github.v3+json", "User-Agent": "CodeMedic-Scanner/1.0" };

  const [repoRes, contentsRes, langRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers }),
  ]);

  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}. Make sure the repo is public.`);

  const repoData = await repoRes.json() as Record<string, unknown>;
  const contents = contentsRes.ok ? await contentsRes.json() as { name: string; type: string; size: number }[] : [];
  const languages = langRes.ok ? await langRes.json() as Record<string, number> : {};

  // Sample key files
  const keyFiles = ["package.json", "README.md", "requirements.txt", "Cargo.toml", "go.mod", "pom.xml"];
  const fileContents: string[] = [];
  for (const file of keyFiles) {
    const entry = Array.isArray(contents) ? contents.find((c: { name: string }) => c.name === file) : null;
    if (entry && (entry as { size: number }).size < 20000) {
      try {
        const fr = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, { headers });
        if (fr.ok) {
          const fd = await fr.json() as { content?: string };
          if (fd.content) fileContents.push(`// ${file}\n${Buffer.from(fd.content, "base64").toString("utf-8").slice(0, 1500)}`);
        }
      } catch { /* skip */ }
    }
  }

  const issues = analyzeRepoStructure(contents, repoData, languages);
  const techStack = Object.keys(languages).slice(0, 6);
  const context = `Repository: ${owner}/${repo}\nDescription: ${repoData.description ?? "N/A"}\nStars: ${repoData.stargazers_count}\nLanguages: ${techStack.join(", ")}\n\nFiles:\n${fileContents.join("\n\n")}`;

  const aiAnalysis = await analyzeWithGroq("github", url, context, null, issues);

  return {
    id: uuidv4(),
    url,
    type: "github",
    title: `${owner}/${repo}`,
    scores: aiAnalysis.scores,
    issues: [...issues, ...aiAnalysis.extraIssues],
    techStack,
    summary: aiAnalysis.summary,
    recommendations: aiAnalysis.recommendations,
    createdAt: new Date().toISOString(),
  };
}

function analyzeRepoStructure(
  contents: { name: string; type: string; size?: number }[],
  repoData: Record<string, unknown>,
  languages: Record<string, number>
): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const names = Array.isArray(contents) ? contents.map((c) => c.name.toLowerCase()) : [];

  if (!names.includes("readme.md") && !names.includes("readme")) issues.push({ id: "DOC-001", category: "dependency", severity: "medium", title: "No README Found", description: "The repository has no README file.", recommendation: "Add a README.md with setup instructions and project description.", });
  if (!names.includes(".gitignore")) issues.push({ id: "SEC-001", category: "security", severity: "medium", title: "No .gitignore File", description: "Without .gitignore, sensitive files may be accidentally committed.", recommendation: "Add a .gitignore appropriate for your tech stack.", });
  if (!names.some((n) => n.includes("license"))) issues.push({ id: "DOC-002", category: "dependency", severity: "low", title: "No License File", description: "Repository has no license, making reuse legally ambiguous.", recommendation: "Add an appropriate license file (MIT, Apache 2.0, etc.).", });

  const hasEnvExample = names.some((n) => n.includes(".env.example") || n.includes(".env.sample"));
  const hasEnv = names.some((n) => n === ".env");
  if (hasEnv) issues.push({ id: "SEC-002", category: "security", severity: "critical", title: ".env File Committed to Repo", description: "A .env file was found in the repository root. This may contain secrets.", recommendation: "Remove .env from git history and add it to .gitignore immediately.", });
  if (!hasEnvExample && Object.keys(languages).length > 0) issues.push({ id: "DOC-003", category: "dependency", severity: "low", title: "No .env.example File", description: "No environment variable template found.", recommendation: "Add a .env.example with all required variable names (no values).", });

  const hasTests = names.some((n) => ["test", "tests", "__tests__", "spec", "specs"].includes(n));
  if (!hasTests) issues.push({ id: "CODE-001", category: "code", severity: "medium", title: "No Test Directory Found", description: "No test folder detected in repository root.", recommendation: "Add automated tests to improve code reliability.", });

  const isStale = repoData.pushed_at && new Date(repoData.pushed_at as string) < new Date(Date.now() - 180 * 24 * 3600 * 1000);
  if (isStale) issues.push({ id: "CODE-002", category: "code", severity: "low", title: "Repository Appears Inactive", description: "No commits in the last 6 months.", recommendation: "Consider archiving the repository or resuming maintenance.", });

  return issues;
}

// ── Groq AI Analysis ─────────────────────────────────────────────────────────

async function analyzeWithGroq(
  type: string,
  url: string,
  context: string,
  seo: SeoMetrics | null,
  existingIssues: ScanIssue[]
): Promise<{ scores: ScanScores; summary: string; recommendations: string[]; extraIssues: ScanIssue[] }> {
  const fallback = {
    scores: { overall: 65, performance: 60, seo: 65, accessibility: 70, security: 75, maintainability: 60 },
    summary: `Scan of ${url} completed with ${existingIssues.length} issues found.`,
    recommendations: ["Review and fix the identified issues.", "Consider a full audit for deeper insights."],
    extraIssues: [] as ScanIssue[],
  };

  if (!process.env.GROQ_API_KEY) return fallback;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const seoStr = seo ? `\nSEO: title="${seo.title}", description="${seo.description}", viewport=${seo.hasViewport}, OG=${seo.hasOpenGraph}, H1 count=${seo.headings.filter((h) => h.level === 1).length}, images without alt=${seo.images.filter((i) => !i.hasAlt).length}` : "";
    const issuesStr = existingIssues.map((i) => `[${i.severity.toUpperCase()}] ${i.title}`).join("\n");

    const prompt = `You are a senior ${type === "github" ? "code reviewer" : "web analyst"}.
Analyze this ${type === "github" ? "GitHub repository" : "website"}: ${url}
${seoStr}

Context (truncated):
${context.slice(0, 4000)}

Pre-detected issues:
${issuesStr || "None"}

Return ONLY valid JSON (no markdown):
{
  "scores": { "overall": 0-100, "performance": 0-100, "seo": 0-100, "accessibility": 0-100, "security": 0-100, "maintainability": 0-100 },
  "summary": "2-3 sentence executive summary",
  "recommendations": ["top 5 actionable recommendations"],
  "extraIssues": [{ "id": "AI-001", "category": "code|performance|security|seo|accessibility|dependency", "severity": "critical|high|medium|low|info", "title": "Issue title", "description": "Detail", "recommendation": "Fix" }]
}`;

    const res = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
      temperature: 0.2,
    });

    const raw = (res.choices[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    return {
      scores: parsed.scores ?? fallback.scores,
      summary: parsed.summary ?? fallback.summary,
      recommendations: parsed.recommendations ?? fallback.recommendations,
      extraIssues: (parsed.extraIssues ?? []).map((i: ScanIssue, idx: number) => ({
        ...i,
        id: i.id ?? `AI-${String(idx + 1).padStart(3, "0")}`,
      })),
    };
  } catch {
    return fallback;
  }
}
