# Portfolio Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `lhocke.dev` — a fast, content-driven personal portfolio (single page, five sections) that supports Dylan's discreet 2026 job search and deploys to Cloudflare Pages.

**Architecture:** Astro static site (zero JS by default) styled with Tailwind CSS v4 (CSS-first `@theme` tokens). Project entries are a typed content collection. Sections are small, single-responsibility `.astro` components assembled in `src/pages/index.astro`. An employer-safe content verifier scans the built HTML as a guardrail. Deployed as static `dist/` to Cloudflare Pages on the existing Cloudflare-managed `lhocke.dev`.

**Tech Stack:** Astro 5+, Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript (strict), Fontsource (self-hosted fonts), Node test/verify scripts, Wrangler (Cloudflare deploy).

**Spec:** `docs/superpowers/specs/2026-06-14-portfolio-revamp-design.md` — read it first. The hard constraints in spec §2 are load-bearing for this plan, especially **no active-job-search signals** (enforced by Task 9's verifier).

**Design source of truth:** Direction A "Editorial Calm" — Newsreader (serif display) + Inter (body), warm-neutral paper/ink palette, single evergreen-teal accent. Approved copy lives in spec §7–§8.

---

## File Structure

```
portfolio/
├── package.json                  # deps + scripts (dev/build/preview/check/verify)
├── astro.config.mjs              # Astro config: site URL + @tailwindcss/vite plugin
├── tsconfig.json                 # extends astro/tsconfigs/strict
├── src/
│   ├── env.d.ts                  # Astro type shims
│   ├── styles/
│   │   └── global.css            # @import "tailwindcss" + @theme design tokens
│   ├── layouts/
│   │   └── BaseLayout.astro      # <html> shell: head/meta/SEO, font imports, global.css
│   ├── content.config.ts         # projects collection (glob loader + Zod schema)
│   ├── content/
│   │   └── projects/
│   │       ├── 1-zork.md
│   │       ├── 2-zendesk-mcp.md
│   │       ├── 3-athena.md
│   │       └── 4-pantheon.md
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── About.astro
│   │   ├── ProjectCard.astro
│   │   ├── Projects.astro
│   │   ├── Skills.astro
│   │   ├── Contact.astro
│   │   └── Footer.astro
│   └── pages/
│       └── index.astro           # assembles all sections in BaseLayout
├── public/
│   ├── resume.pdf                # copied from Job Search 2026 folder
│   └── favicon.svg
└── scripts/
    └── verify-site.mjs           # employer-safe + required-content guardrail
```

Each component owns exactly one section. `BaseLayout` owns the document shell and `<head>`. `verify-site.mjs` owns the constraint guardrail. Files that change together (a section's markup + its copy) live together.

---

## Task 1: Scaffold the Astro + Tailwind v4 project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts`, `src/styles/global.css`, `src/pages/index.astro`

We hand-author the scaffold (rather than the interactive `npm create astro`) because the repo already contains `.git`, `docs/`, and `.gitignore` — a deterministic set of files avoids the scaffolder's "non-empty directory" prompt.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "lhocke-portfolio",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "verify": "astro build && node scripts/verify-site.mjs"
  }
}
```

- [ ] **Step 2: Confirm font packages exist, then install dependencies (uses latest to avoid baking stale versions)**

Run:
```bash
npm view @fontsource-variable/inter version
npm view @fontsource-variable/newsreader version
```
Expected: each prints a version string. If `@fontsource-variable/newsreader` 404s, substitute `@fontsource/newsreader` in the install below and in Task 2 Step 3's `@import`.

Then:
```bash
npm install astro@latest @astrojs/check@latest typescript@latest
npm install @tailwindcss/vite@latest tailwindcss@latest
npm install @fontsource-variable/inter@latest @fontsource-variable/newsreader@latest
```
Expected: installs succeed; `node_modules/` created (already gitignored).

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://lhocke.dev',
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Create `src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 6: Create `src/styles/global.css` (Tailwind import + design tokens)**

```css
@import "tailwindcss";

@theme {
  /* Typography */
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Newsreader Variable", ui-serif, Georgia, "Times New Roman", serif;

  /* Palette — warm neutral with one restrained accent */
  --color-paper: #fafaf9;   /* page background */
  --color-ink: #1c1917;     /* primary text */
  --color-muted: #57534e;   /* secondary text */
  --color-faint: #a8a29e;   /* tertiary / labels */
  --color-line: #e7e5e4;    /* hairline rules */
  --color-accent: #0f766e;  /* evergreen teal — links + kicker */
}

html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

- [ ] **Step 7: Create a temporary `src/pages/index.astro` to prove the build**

```astro
---
import "../styles/global.css";
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>lhocke.dev</title>
  </head>
  <body class="bg-paper text-ink font-sans">
    <h1 class="font-serif text-4xl">Scaffold OK</h1>
  </body>
</html>
```

- [ ] **Step 8: Verify the build succeeds**

Run: `npm run build`
Expected: completes with no errors; `dist/index.html` is created and contains "Scaffold OK".

- [ ] **Step 9: Verify the dev server renders styled output**

Run: `npm run dev` (then stop it with Ctrl-C after confirming)
Expected: dev server starts; visiting the printed localhost URL shows "Scaffold OK" in a serif font on an off-white background. Stop the server before continuing (do not leave it running — see CLAUDE.md rule 24).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/env.d.ts src/styles/global.css src/pages/index.astro
git commit -m "Scaffold Astro + Tailwind v4 project"
```

---

## Task 2: Base layout (document shell, fonts, SEO meta)

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/layouts/BaseLayout.astro`**

```astro
---
import "@fontsource-variable/inter";
import "@fontsource-variable/newsreader";
import "../styles/global.css";

interface Props {
  title?: string;
  description?: string;
}

const {
  title = "Dylan Ishihara — Developer-turned-support-leader who never stopped building",
  description = "Dylan Ishihara is a full-stack developer turned technical-support leader who builds and evaluates production AI tooling. Oakland, CA.",
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site).toString();
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- Open Graph / Twitter -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body class="bg-paper text-ink font-sans antialiased">
    <main class="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <slot />
    </main>
  </body>
</html>
```

Note: `max-w-2xl` (~672px) gives the calm ~700px reading column from the spec. Adjust to `max-w-3xl` only if the design feels cramped during Task 9 polish.

- [ ] **Step 2: Replace `src/pages/index.astro` to use the layout**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout>
  <h1 class="font-serif text-5xl font-medium tracking-tight">Layout OK</h1>
</BaseLayout>
```

- [ ] **Step 3: Verify build + fonts load**

Run: `npm run build`
Expected: build succeeds. Inspect `dist/index.html` — it contains the `<title>`, `<meta name="description">`, canonical link, and OG tags. Font CSS from Fontsource is bundled into the page's stylesheet (no external Google Fonts request).

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "Add base layout with fonts and SEO meta"
```

---

## Task 3: Projects content collection

**Files:**
- Create: `src/content.config.ts`, `src/content/projects/1-zork.md`, `src/content/projects/2-zendesk-mcp.md`, `src/content/projects/3-athena.md`, `src/content/projects/4-pantheon.md`

Copy is taken verbatim from spec §7. Do not paraphrase the project blurbs — the wording was deliberately negotiated for honesty and employer-safety.

- [ ] **Step 1: Create `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    tag: z.string(),              // e.g. "Live · Playable"
    blurb: z.string(),
    href: z.string().optional(),  // omitted = no outbound link (e.g. athena)
    linkLabel: z.string().optional(),
    order: z.number(),
  }),
});

export const collections = { projects };
```

- [ ] **Step 2: Create `src/content/projects/1-zork.md`**

```md
---
title: "Zork, ZIL → TypeScript"
tag: "Live · Playable"
blurb: "Ported the open-sourced Zork from 1970s ZIL to modern TypeScript, largely autonomously with an AI coding tool, and deployed it live."
href: "https://zork.lhocke.dev"
linkLabel: "zork.lhocke.dev"
order: 1
---
```

- [ ] **Step 3: Create `src/content/projects/2-zendesk-mcp.md`**

```md
---
title: "Zendesk MCP Server"
tag: "Open Source"
blurb: "Extended an open-source Zendesk MCP server with OAuth, HTTP transport alongside stdio, and richer knowledge-base handling."
href: "https://github.com/lhocke/zendesk-mcp-server"
linkLabel: "github.com/lhocke/zendesk-mcp-server"
order: 2
---
```

- [ ] **Step 4: Create `src/content/projects/3-athena.md`**

```md
---
title: "Investigation & Eval Pipeline"
tag: "AI Tooling"
blurb: "A multi-source investigation pipeline I built — specialized agents correlating evidence across systems, with PII redaction and a structured-output contract — now in active use by my team. Backed by blind, multi-fixture model evaluations to right-size local vs. cloud models."
order: 3
---
```

Note: no `href` — repo is private and not yet sanitized (spec §7). The card renders without an outbound link.

- [ ] **Step 5: Create `src/content/projects/4-pantheon.md`**

```md
---
title: "Pantheon"
tag: "In Progress"
blurb: "A personal multi-model LLM routing and failover system across a small machine fleet."
href: "https://pantheon.lhocke.dev"
linkLabel: "pantheon.lhocke.dev"
order: 4
---
```

- [ ] **Step 6: Verify the collection type-checks and loads**

Run: `npm run check`
Expected: `astro check` passes (it generates collection types and validates frontmatter against the schema). Zero errors. If a frontmatter field is missing/mistyped, the error names the file — fix and re-run.

- [ ] **Step 7: Commit**

```bash
git add src/content.config.ts src/content/projects/
git commit -m "Add projects content collection with four entries"
```

---

## Task 4: Nav, Hero, and About components

**Files:**
- Create: `src/components/Nav.astro`, `src/components/Hero.astro`, `src/components/About.astro`
- Modify: `src/pages/index.astro`

Copy is from spec §8.

- [ ] **Step 1: Create `src/components/Nav.astro`**

```astro
---
---
<nav class="flex items-center justify-between text-sm text-muted">
  <span class="font-semibold text-ink">Dylan Ishihara</span>
  <div class="flex gap-6">
    <a href="#about" class="hover:text-ink transition-colors">About</a>
    <a href="#projects" class="hover:text-ink transition-colors">Projects</a>
    <a href="#contact" class="hover:text-ink transition-colors">Contact</a>
  </div>
</nav>
```

- [ ] **Step 2: Create `src/components/Hero.astro`**

```astro
---
---
<header class="pt-14 pb-2">
  <p class="font-serif italic text-accent mb-3">Oakland, California</p>
  <h1 class="font-serif text-4xl sm:text-5xl font-medium leading-tight tracking-tight mb-5">
    Developer-turned-support-leader who never stopped building.
  </h1>
  <p class="text-lg leading-relaxed text-muted max-w-xl mb-7">
    I'm a full-stack engineer who grew into technical-support leadership — and kept
    shipping along the way, lately production AI tooling. I like building the thing,
    then proving it actually works.
  </p>
  <div class="flex flex-wrap gap-3">
    <a href="/resume.pdf"
       class="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-90 transition-opacity">
      View résumé
    </a>
    <a href="#contact"
       class="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink transition-colors">
      Get in touch
    </a>
  </div>
</header>
```

- [ ] **Step 3: Create `src/components/About.astro`**

```astro
---
---
<section id="about" class="scroll-mt-8">
  <hr class="border-line my-12" />
  <p class="text-xs font-semibold tracking-widest uppercase text-faint mb-4">About</p>
  <h2 class="font-serif text-3xl font-medium tracking-tight mb-4">The short version.</h2>
  <div class="space-y-4 text-base leading-relaxed text-muted">
    <p>
      I started as a freelance full-stack developer, moved into technical support to be
      closer to the people actually using the software, and grew into leading a support
      team for a digital-banking platform. The title says support; the habit says
      builder — I've never stopped writing code.
    </p>
    <p>
      These days that means authoring AI tooling that real teams depend on: a Model
      Context Protocol server, and a multi-source investigation pipeline that correlates
      evidence across half a dozen systems. I'm genuinely skeptical of AI hype — which is
      exactly why I measure what I build.
    </p>
  </div>
</section>
```

- [ ] **Step 4: Wire Nav + Hero + About into `src/pages/index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Nav from "../components/Nav.astro";
import Hero from "../components/Hero.astro";
import About from "../components/About.astro";
---
<BaseLayout>
  <Nav />
  <Hero />
  <About />
</BaseLayout>
```

- [ ] **Step 5: Verify visually**

Run: `npm run dev` (stop it when done)
Expected: hero with serif headline + teal italic kicker, two buttons, an About section below a hairline rule. Anchor links (#about) scroll smoothly. Stop the dev server before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/components/Nav.astro src/components/Hero.astro src/components/About.astro src/pages/index.astro
git commit -m "Add nav, hero, and about sections"
```

---

## Task 5: Projects section (ProjectCard + Projects)

**Files:**
- Create: `src/components/ProjectCard.astro`, `src/components/Projects.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/ProjectCard.astro`**

```astro
---
interface Props {
  title: string;
  tag: string;
  blurb: string;
  href?: string;
  linkLabel?: string;
}
const { title, tag, blurb, href, linkLabel } = Astro.props;
const isExternal = href?.startsWith("http");
---
<div class="rounded-xl border border-line bg-white p-5">
  <span class="text-xs font-semibold tracking-wide uppercase text-accent">{tag}</span>
  <h3 class="font-serif text-xl font-semibold mt-2 mb-2">{title}</h3>
  <p class="text-sm leading-relaxed text-muted mb-3">{blurb}</p>
  {href && (
    <a
      href={href}
      class="text-sm font-semibold text-accent hover:underline"
      {...isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {}}
    >
      {linkLabel ?? "Read more"} →
    </a>
  )}
</div>
```

- [ ] **Step 2: Create `src/components/Projects.astro`**

```astro
---
import { getCollection } from "astro:content";
import ProjectCard from "./ProjectCard.astro";

const projects = (await getCollection("projects")).sort(
  (a, b) => a.data.order - b.data.order
);
---
<section id="projects" class="scroll-mt-8">
  <hr class="border-line my-12" />
  <p class="text-xs font-semibold tracking-widest uppercase text-faint mb-5">Selected Projects</p>
  <div class="grid gap-4 sm:grid-cols-2">
    {projects.map((p) => (
      <ProjectCard
        title={p.data.title}
        tag={p.data.tag}
        blurb={p.data.blurb}
        href={p.data.href}
        linkLabel={p.data.linkLabel}
      />
    ))}
  </div>
</section>
```

- [ ] **Step 3: Add `<Projects />` to `src/pages/index.astro`**

Add the import and place `<Projects />` after `<About />`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Nav from "../components/Nav.astro";
import Hero from "../components/Hero.astro";
import About from "../components/About.astro";
import Projects from "../components/Projects.astro";
---
<BaseLayout>
  <Nav />
  <Hero />
  <About />
  <Projects />
</BaseLayout>
```

- [ ] **Step 4: Verify cards render correctly**

Run: `npm run build` then inspect `dist/index.html`.
Expected:
- Four cards in source order: Zork, Zendesk MCP Server, Investigation & Eval Pipeline, Pantheon.
- Zork links to `https://zork.lhocke.dev`, Zendesk to `https://github.com/lhocke/zendesk-mcp-server`, Pantheon to `https://pantheon.lhocke.dev` — each with `target="_blank"` and `rel="noopener noreferrer"`.
- The Investigation & Eval Pipeline card has **no** link element (athena is unlinked by design).

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectCard.astro src/components/Projects.astro src/pages/index.astro
git commit -m "Add projects section rendered from content collection"
```

---

## Task 6: Skills, Contact, and Footer

**Files:**
- Create: `src/components/Skills.astro`, `src/components/Contact.astro`, `src/components/Footer.astro`
- Modify: `src/pages/index.astro`

Skills groups and contact copy are from spec §8.

- [ ] **Step 1: Create `src/components/Skills.astro`**

```astro
---
const groups = [
  {
    name: "Engineering",
    items: ["TypeScript / JavaScript", "Python", "React / React Native", "Node.js / Express", "SQL · Postgres · Mongo", "REST APIs · OAuth/SSO"],
  },
  {
    name: "Support & Ops",
    items: ["Escalation management", "SLA design", "Incident coverage", "Team onboarding", "Distributed leadership", "Integration delivery"],
  },
  {
    name: "Domains",
    items: ["Enterprise SaaS", "Fintech / digital banking", "AI tooling & agents", "MCP servers", "Model evaluation"],
  },
];
---
<section id="skills" class="scroll-mt-8">
  <hr class="border-line my-12" />
  <p class="text-xs font-semibold tracking-widest uppercase text-faint mb-5">Skills</p>
  <div class="grid gap-8 sm:grid-cols-3">
    {groups.map((g) => (
      <div>
        <h4 class="text-sm font-bold text-ink mb-3">{g.name}</h4>
        <ul class="space-y-1.5">
          {g.items.map((i) => <li class="text-sm text-muted">{i}</li>)}
        </ul>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Create `src/components/Contact.astro`**

```astro
---
const links = [
  { label: "Email", href: "mailto:dylan.ishihara@gmail.com" },
  { label: "LinkedIn", href: "https://linkedin.com/in/dylan-ishihara" },
  { label: "GitHub", href: "https://github.com/lhocke" },
  { label: "Résumé", href: "/resume.pdf", accent: true },
];
---
<section id="contact" class="scroll-mt-8 text-center">
  <hr class="border-line my-12" />
  <h2 class="font-serif text-3xl font-medium tracking-tight mb-3">Let's talk.</h2>
  <p class="text-base leading-relaxed text-muted max-w-md mx-auto mb-5">
    Always happy to trade notes on AI tooling, support, or the craft of building things that last.
  </p>
  <div class="flex flex-wrap justify-center gap-6 text-sm">
    {links.map((l) => (
      <a
        href={l.href}
        class={l.accent ? "font-semibold text-accent hover:underline" : "text-muted hover:text-ink transition-colors"}
        {...l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {}}
      >
        {l.label}
      </a>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Create `src/components/Footer.astro`**

```astro
---
const year = new Date().getFullYear();
---
<footer class="text-center text-xs text-faint pt-10">
  © {year} Dylan Ishihara · Oakland, CA
</footer>
```

- [ ] **Step 4: Complete `src/pages/index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Nav from "../components/Nav.astro";
import Hero from "../components/Hero.astro";
import About from "../components/About.astro";
import Projects from "../components/Projects.astro";
import Skills from "../components/Skills.astro";
import Contact from "../components/Contact.astro";
import Footer from "../components/Footer.astro";
---
<BaseLayout>
  <Nav />
  <Hero />
  <About />
  <Projects />
  <Skills />
  <Contact />
  <Footer />
</BaseLayout>
```

- [ ] **Step 5: Verify the full page**

Run: `npm run dev` (stop it when done)
Expected: complete single-page flow — nav, hero, about, four project cards, three skill columns, centered contact with four links, footer with current year. Stop the dev server before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/components/Skills.astro src/components/Contact.astro src/components/Footer.astro src/pages/index.astro
git commit -m "Add skills, contact, and footer sections"
```

---

## Task 7: Résumé, favicon, and assets

**Files:**
- Create: `public/resume.pdf`, `public/favicon.svg`

- [ ] **Step 1: Copy the résumé PDF into `public/`**

Run:
```bash
mkdir -p public
cp "/Users/lhocke/Documents/Claude/Projects/Job Search 2026/Dylan_Ishihara_Resume.pdf" public/resume.pdf
```
Expected: `public/resume.pdf` exists. Verify: `ls -la public/resume.pdf` shows a non-zero file size.

- [ ] **Step 2: Create a minimal `public/favicon.svg` (monogram)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#1c1917"/>
  <text x="16" y="22" font-family="Georgia, serif" font-size="16" fill="#fafaf9" text-anchor="middle">DI</text>
</svg>
```

- [ ] **Step 3: Verify assets are served in the build**

Run: `npm run build`
Expected: `dist/resume.pdf` and `dist/favicon.svg` both exist (Astro copies `public/` to `dist/` verbatim).

- [ ] **Step 4: Commit**

```bash
git add public/resume.pdf public/favicon.svg
git commit -m "Add résumé PDF and favicon"
```

---

## Task 8: Responsive + accessibility polish

**Files:**
- Modify: `src/components/Nav.astro`, `src/layouts/BaseLayout.astro` (as needed)

- [ ] **Step 1: Verify mobile layout and tighten if needed**

Run: `npm run dev`, then in the browser narrow the viewport to ~375px (or use device emulation).
Expected: no horizontal scroll; nav links wrap or remain readable; project grid collapses to one column; skills collapse to one column; buttons wrap cleanly.
If the nav links crowd the name on mobile, reduce the gap or hide secondary links below `sm`. Apply the minimal fix only if there's an actual problem. Stop the dev server when done.

```
Actual (record what you observed at ~375px):
```

- [ ] **Step 2: Accessibility pass (semantics + contrast)**

Confirm in the built markup / dev tools:
- One `<h1>` (hero), section headings are `<h2>`, card titles `<h3>` — no level skips.
- All links have discernible text; external links carry `rel="noopener noreferrer"`.
- Accent teal `#0f766e` on white passes WCAG AA for normal text (it does: contrast ≈ 5.3:1). Muted text `#57534e` on paper passes AA (≈ 7:1).
- `prefers-reduced-motion` is honored (smooth scroll disabled — already in `global.css`).

```
Actual (note any contrast or semantics issues found + fixes applied):
```

- [ ] **Step 3: Commit any polish changes**

```bash
git add -A
git commit -m "Responsive and accessibility polish"
```

---

## Task 9: Employer-safe content verifier (guardrail)

**Files:**
- Create: `scripts/verify-site.mjs`

This is the automated enforcement of spec §2's hard constraints. It scans the built HTML for forbidden job-search signals and asserts required content is present. Write it, run it, and fix any violations it surfaces.

- [ ] **Step 1: Create `scripts/verify-site.mjs`**

```js
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const html = readFileSync(join(DIST, "index.html"), "utf8");
const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").toLowerCase();

const errors = [];

// 1. No active-job-search signals (spec §2 hard constraint).
const FORBIDDEN = [
  "open to work", "looking for", "seeking a", "seeking new", "actively seeking",
  "hire me", "available for hire", "available for work", "job search",
  "job-seeking", "currently looking", "new opportunity",
];
for (const phrase of FORBIDDEN) {
  if (text.includes(phrase)) errors.push(`FORBIDDEN job-search signal present: "${phrase}"`);
}

// 2. Required content present.
const REQUIRED = [
  "dylan ishihara",
  "zork.lhocke.dev",
  "github.com/lhocke/zendesk-mcp-server",
  "pantheon.lhocke.dev",
  "dylan.ishihara@gmail.com",
  "linkedin.com/in/dylan-ishihara",
];
for (const needle of REQUIRED) {
  if (!text.includes(needle.toLowerCase())) errors.push(`MISSING required content: "${needle}"`);
}

// 3. Résumé asset shipped and linked.
if (!existsSync(join(DIST, "resume.pdf"))) errors.push("MISSING asset: dist/resume.pdf");
if (!html.includes("/resume.pdf")) errors.push("MISSING link to /resume.pdf");

// 4. athena must remain unlinked (private/unsanitized — spec §7).
if (html.includes("lhocke/athena")) errors.push("LEAK: athena repo link present (must stay unlinked)");

if (errors.length) {
  console.error("❌ verify-site failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("✅ verify-site passed: no job-search signals, all required content present.");
```

- [ ] **Step 2: Run the verifier against the current build**

Run: `npm run verify`
Expected: `✅ verify-site passed`. If it fails, the message names the exact problem — fix the offending content (do NOT loosen the FORBIDDEN list to make a real signal pass) and re-run.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-site.mjs package.json
git commit -m "Add employer-safe content verifier"
```

---

## Task 10: Deploy to Cloudflare Pages

**Files:** none (deploy + DNS configuration)

⚠️ This task touches the **live `lhocke.dev` domain** — an outward-facing, hard-to-reverse action. Get Dylan's explicit go-ahead before the custom-domain cutover (Step 4). Deploy to the Pages preview URL first and confirm it looks right.

- [ ] **Step 1: Push the repo to GitHub**

Confirm with Dylan whether the repo should be **public** (reasonable — the site is sanitized and showing you build is on-message) or **private**. Then:
```bash
gh repo create lhocke/portfolio --source=. --push --<public|private>
```
Expected: repo created and `main` pushed.

- [ ] **Step 2: Create the Cloudflare Pages project and deploy the build**

Use Wrangler (Cloudflare's first-party CLI — see the `wrangler` skill for current syntax). Build then deploy the static output:
```bash
npm run build
npx wrangler pages deploy dist --project-name=lhocke-portfolio
```
Expected: Wrangler uploads `dist/` and prints a `*.pages.dev` preview URL.

- [ ] **Step 3: Verify the preview deployment**

Open the printed `*.pages.dev` URL.
Expected: the full site renders; résumé downloads; all four project links work; no job-search signals.

```
Actual (preview URL + what you observed):
```

- [ ] **Step 4: Connect the custom domain `lhocke.dev` (requires Dylan's go-ahead)**

Recommended ongoing setup: in the Cloudflare dashboard, connect the GitHub repo to the Pages project (build command `npm run build`, output directory `dist`) so pushes auto-deploy; then add `lhocke.dev` as a custom domain on the Pages project. Because the domain is already Cloudflare-managed, DNS records are created automatically.
Expected: `https://lhocke.dev` serves the new site over HTTPS.

```
Actual (confirm lhocke.dev resolves to the new site):
```

- [ ] **Step 5: Final post-deploy verification**

Run a production check: visit `https://lhocke.dev`, confirm résumé link, project links, and run Lighthouse (Chrome DevTools → Lighthouse, or `npx lighthouse https://lhocke.dev`). Target: Performance, Accessibility, Best Practices, SEO all ≥ 95 (Astro static should hit this easily).

```
Actual (Lighthouse scores: Perf / A11y / BP / SEO):
```

---

## Notes / Deferred (from spec §10–§11)

- **Freelance full-stack card:** deferred to Phase 2 unless Dylan asks to include it now (spec §11). To add later: drop a `5-freelance.md` into `src/content/projects/` — no code change needed.
- **Phase 2+:** dedicated project pages, embedded live Zork terminal, AI-pipeline visualization, writing/articles section, elevated GitHub once scrubbed repos exist. The content-collection + islands architecture supports all of these without re-platforming.
- **Final accent color:** evergreen teal `#0f766e` is the working choice (spec §6/§11); swap the single `--color-accent` token in `global.css` if Dylan wants to try an alternative during Task 8.
- **OG image:** a social-share image is not in Phase 1; `twitter:card` is set to `summary_large_image` in anticipation. Add `public/og.png` + the `og:image` meta when ready.
```
