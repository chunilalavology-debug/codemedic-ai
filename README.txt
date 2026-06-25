================================================================================
                         CODEMEDIC AI - PROJECT DOCUMENTATION
================================================================================

Live Demo     : https://codemedic-ai.vercel.app
GitHub Repo   : https://github.com/chunilalavology-debug/codemedic-ai

--------------------------------------------------------------------------------
WHAT IS THIS PROJECT?
--------------------------------------------------------------------------------

CodeMedic AI is an AI-powered developer platform that helps you:

  - Fix broken code and understand error stack traces
  - Scan websites and GitHub repos for SEO, security, and performance issues
  - Convert UI screenshots into React, Next.js, HTML, Vue, or Tailwind code
  - Test HTTP APIs and export curl / fetch / axios snippets
  - Save analysis history and view reports over time

The app uses Next.js 16, Supabase (auth + database), and Groq AI (Llama 3.3 70B).

--------------------------------------------------------------------------------
SCREENSHOTS (included in repository)
--------------------------------------------------------------------------------

Home Page (Landing)
  File: public/docs/homepage.png
  Description: Public marketing page with hero, features, FAQ, and sign-up.

Login Page
  File: public/docs/login-page.png
  Description: Email/password sign-in powered by Supabase Auth.

Dashboard - Overview
  File: public/docs/dashboard-overview.png
  Description: Main dashboard with stats, quick actions, and recent analyses.

Dashboard - Profile Settings
  File: public/docs/dashboard-settings.png
  Description: Profile photo, nickname, bio, password, and theme settings.

--------------------------------------------------------------------------------
ALL FUNCTIONALITIES IN DETAIL
--------------------------------------------------------------------------------

1. AI CODE ANALYZER (/analyze)
   - Paste code or upload a file
   - Optional error message / stack trace input
   - Analysis types: Full Scan, Errors, Security, Performance
   - Supports 12+ languages (TypeScript, JavaScript, Python, Rust, Go, etc.)
   - Returns: root cause, explanation, fixed code, diff, issue list
   - Copy fixed code with syntax highlighting
   - Results saved to your history automatically

2. SITE & REPO SCANNER (/scan)
   - Website mode: scan any public URL
   - GitHub mode: scan public repositories
   - Checks: SEO, security headers, accessibility, performance
   - Scores: Overall, SEO, Security, Performance, Accessibility (0-100)
   - Expandable issue list with severity levels
   - Copy full scan report

3. IMAGE TO CODE (/image-to-code)
   - Upload UI screenshot (JPG, PNG, WebP, GIF up to 5 MB)
   - Frameworks: HTML, React, Next.js, Vue, Tailwind
   - Modes: Component or full page
   - AI vision model generates production-ready code
   - Copy or download generated code

4. API INSPECTOR (/api-inspector)
   - Test GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
   - Bearer or Basic authentication support
   - Custom request headers and body
   - View response status, latency, headers, and body
   - Detects slow responses and missing security headers
   - Export curl, fetch, and axios code snippets

5. ANALYSIS HISTORY (/history)
   - View all past code analyses
   - Expand to see full results
   - Delete individual records
   - Paginated list with load more
   - Private to your account (database row-level security)

6. REPORTS (/reports)
   - Summary statistics (total analyses, issues, languages)
   - Activity charts over time
   - Language and analysis type breakdown
   - Recent activity timeline

7. OVERVIEW DASHBOARD (/overview)
   - Personalized welcome message
   - Stats: total analyses, issues found, security findings
   - Quick action cards to all tools
   - Recent analyses preview

8. PROFILE & SETTINGS (/settings)
   Profile Settings:
     - Upload profile photo (avatar, max 2 MB)
     - Full name, nickname, bio, location, website
     - Email and account creation date display

   Password:
     - Change password with current + new password fields
     - Minimum 8 characters required

   Appearance:
     - Light, Dark, or System theme

   Sign Out:
     - Log out and return to home page

   Header Profile Menu:
     - Click avatar to see email, Profile Settings link, and Log out

9. AUTHENTICATION
   - Sign up: /signup
   - Sign in: /login
   - Forgot password: /forgot-password
   - Update password: /update-password
   - Protected dashboard routes (login required)
   - Secure cookie-based sessions via Supabase SSR

--------------------------------------------------------------------------------
TECH STACK
--------------------------------------------------------------------------------

  Next.js 16          - React framework (App Router)
  TypeScript          - Type-safe codebase
  Tailwind CSS 4      - Styling
  Supabase            - Auth, PostgreSQL, Storage, RLS
  Groq AI             - Llama 3.3 70B (text), Llama 4 Scout (vision)
  Vercel              - Deployment

--------------------------------------------------------------------------------
SETUP INSTRUCTIONS
--------------------------------------------------------------------------------

1. Clone:  git clone https://github.com/chunilalavology-debug/codemedic-ai.git
2. Install: npm install
3. Copy env: cp .env.example .env.local
4. Add keys:
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     GROQ_API_KEY
     NEXT_PUBLIC_APP_URL
5. Run SQL from supabase/schema.sql in Supabase SQL Editor
6. Start: npm run dev
7. Open: http://localhost:3000

--------------------------------------------------------------------------------
NPM SCRIPTS
--------------------------------------------------------------------------------

  npm run dev          Start development server
  npm run build        Production build
  npm run start        Start production server
  npm run lint         Run ESLint
  npm run type-check   TypeScript check
  npm run test         Run unit tests

--------------------------------------------------------------------------------
AUTHOR
--------------------------------------------------------------------------------

Built by Shashi Thakur

================================================================================
