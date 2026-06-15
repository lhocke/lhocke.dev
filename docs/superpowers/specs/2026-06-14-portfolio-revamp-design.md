# Portfolio Revamp — Design Spec

*Site: `lhocke.dev` · Owner: Dylan Ishihara · Date: 2026-06-14*

## 1. Goal

A fresh personal site at `lhocke.dev` that supports Dylan's 2026 job search by reading as a confident, polished professional presence. The site's job is to make a recruiter or hiring manager who lands on it in the next few weeks quickly understand: **a full-stack developer who grew into technical-support leadership and never stopped building — and who builds *and evaluates* production AI tooling.**

Replaces a years-stale React site. Built fresh.

## 2. Hard Constraints (non-negotiable)

- **No active-job-search signals.** Dylan is currently employed and searching discreetly. The site must NOT contain "Open to work," "looking for my next role," "2026 job search," availability badges, or anything that would alarm his current employer if they found it. The résumé and contact paths are simply *available*; intent is never announced.
- **Qualitative impact only.** No metrics, backlog sizes, baseline numbers, or improvement percentages. Use "substantial," "significant," "kept stable despite rising volume." Precise figures live only in résumé/interview prep.
- **Sanitize work-confidential material.** No proprietary internal system names, real hostnames, client names, or internal workflows. Describe work AI tooling by *capability*, not internal specifics.
- **Honesty.** No fabrication or overstatement. Credit open-source origins. The honest arc (title says support; habit says builder) is the compelling story — don't paper over it.
- **No positioning toward excluded roles.** Not a "sales engineer." No quota/commission framing. No defense/energy/weapons targeting.

## 3. Audience & Positioning

**Target roles, priority order:**
1. Technical / application support — IC and leadership.
2. Post-sales forward-deployed / delivery / implementation engineering (base + equity, NOT sales).
3. IC software / full-stack engineering.

**One-line positioning:** *Developer-turned-support-leader who never stopped building.*
**Differentiator (front-and-center):** builds production AI tooling — and evaluates it with real eval rigor.
**Voice:** thoughtful, a little irreverent, genuinely skeptical of AI hype but a real builder. Personality lives in the copy, not in loud visual flourish. Remote-first (Oakland; SF-Bay hybrid OK).

## 4. Stack & Architecture

- **Framework:** Astro + Tailwind CSS v4 (matches the Tailwind Plus kit version).
- **Hosting:** Cloudflare Pages (domain already on Cloudflare).
- **Rationale:** Astro ships zero JS by default → near-perfect Lighthouse scores, itself a credibility signal for "I build quality software." Content-driven, fast to ship. When interactive demos arrive, each drops in as an Astro **island** (or its own route) so weight loads only where used — no re-platforming. (Next.js was considered and rejected as premature weight for a mostly-static v1; Astro grows into the same place with a better v1.)
- **Phasing:** Phase 1 = simple content-driven single-page site. Phase 2+ = dedicated project pages with live demos (embedded Zork terminal, AI-pipeline visualization), possibly a writing/articles section. The architecture must not preclude Phase 2.
- **Note:** `pantheon.lhocke.dev` is already an Astro Starlight site — Astro is consistent with Dylan's existing ecosystem.

## 5. Information Architecture (Phase 1)

Single page, anchored sections, top-to-bottom skim:

1. **Hero** — name, one-line positioning, two CTAs: *View résumé* (PDF) and *Get in touch*.
2. **About** — the arc + a little personality (honest builder-through-support story).
3. **Selected Projects** — card grid (details in §7).
4. **Skills / Stack** — three groups: Engineering · Support & Ops · Domains.
5. **Contact** — Email, LinkedIn, GitHub (quiet), Résumé.

Any section can be promoted to its own route later without rework.

## 6. Visual Design System — "Editorial Calm" (Direction A)

Chosen for being senior, timeless, and trustworthy across a conservative fintech panel, with personality carried in the words — which also fits the discreet-employment constraint better than a louder, badge-driven design.

- **Type:** Newsreader (serif display — headings, the italic kicker) + Inter (sans — body, UI). Literary, senior.
- **Palette:** warm-neutral light base (stone/`#fafaf9` paper, `#1c1917` ink) with a single restrained accent.
- **Accent:** evergreen teal (`#0f766e`), used sparingly on links and the italic kicker. (Final accent confirmable during build; teal is the working choice.)
- **Layout:** generous whitespace, ~760px reading column, hairline rules between sections, restrained buttons (solid ink primary, hairline-border secondary).
- **Tone of motion:** minimal; subtle at most. No heavy animation in Phase 1.

## 7. Content — Project Cards (finalized, honest + safe framing)

Order = strongest/most-demonstrable first.

1. **Zork, ZIL → TypeScript** — *Live · Playable.*
   "Ported the open-sourced Zork from 1970s ZIL to modern TypeScript, largely autonomously with an AI coding tool, and deployed it live."
   Links to `zork.lhocke.dev`. The fun, demonstrable centerpiece.

2. **Zendesk MCP Server** — *Open Source.*
   "Extended an open-source Zendesk MCP server with OAuth, HTTP transport (alongside stdio), and richer knowledge-base handling."
   Honestly credits the open-source origin (started as a fork of `reminia`'s project, diverged significantly). Links to the **public** repo `github.com/lhocke/zendesk-mcp-server`.

3. **Investigation & Eval Pipeline (athena)** — *AI Tooling.*
   "A multi-source investigation pipeline I built — specialized agents correlating evidence across systems, with PII redaction and a structured-output contract — now in active use by my team. Backed by blind, multi-fixture model evaluations to right-size local vs. cloud models."
   Dylan's personal project, adapted for and actively used at work. Repo private and not yet sanitized → **no link**, capability-only, no internal names/clients/metrics.

4. **Pantheon** — *In Progress.*
   "A personal multi-model LLM routing and failover system across a small machine fleet."
   Heavily sanitized. Links to `pantheon.lhocke.dev` (a live Starlight docs site, skeleton while the project is under construction). **No** machine names, routing internals, or provider-translation specifics.

*Room reserved (Phase 1 optional / Phase 2):* selected freelance full-stack work.

## 8. Content — Other Sections

- **Hero copy (working):** kicker "Oakland, California"; headline "Developer-turned-support-leader who never stopped building."; lede about being a full-stack engineer who grew into support leadership and keeps shipping (lately AI tooling) — "build the thing, then prove it works."
- **About (working):** freelance full-stack → technical support (to be closer to users) → leading a support team for a digital-banking platform; title says support, habit says builder; lately authoring AI tooling real teams depend on; skeptical of AI hype, which is *why* he measures what he builds. No employer name required; "a digital-banking platform" is sufficient and safe.
- **Skills groups:**
  - *Engineering:* TypeScript/JavaScript, Python, React/React Native, Node.js/Express, SQL (Postgres/MySQL/Mongo), REST APIs, OAuth/SSO, Bash/CLI, Git, Firebase.
  - *Support & Ops:* escalation management, SLA design, incident coverage, team onboarding curriculum, distributed-team leadership, integration delivery.
  - *Domains:* enterprise SaaS, fintech/digital banking, AI tooling & agents, MCP servers, model evaluation.
- **Contact:** "Let's talk / always happy to trade notes on AI tooling, support, or the craft of building things that last." Links: Email (`dylan.ishihara@gmail.com`), LinkedIn (`linkedin.com/in/dylan-ishihara`), GitHub (`github.com/lhocke`, quiet), Résumé (hosted PDF).

## 9. Assets

- **Résumé PDF:** source at `/Users/lhocke/Documents/Claude/Projects/Job Search 2026/Dylan_Ishihara_Resume.pdf` → copy into the site (e.g. `public/resume.pdf`), linked from hero + contact.
- **GitHub:** `github.com/lhocke` — quiet footer/contact link only for now; elevate later once scrubbed public repos exist.
- **Design influence / components:** Tailwind Plus Spotlight (design language), marketing-v4 HTML (framework-agnostic sections), catalyst/application-ui (Phase 2 interactive components).

## 10. Out of Scope (YAGNI for Phase 1)

- Blog/articles, `/uses`, `/speaking` pages (Phase 2+).
- Live embedded Zork terminal / AI-pipeline demo on the main site (Phase 2 — links out for now).
- CMS, comments, analytics dashboards, newsletter.
- Dark mode (can add later; Editorial Calm is a light design).
- Prominent GitHub showcase (until repos are scrubbed).

## 11. Open / Deferred

- Final accent color confirmation during build (teal is the working choice).
- Whether to include a freelance full-stack card in Phase 1 or defer to Phase 2.
- Future: elevate GitHub once public scrubbed repos exist; add live demos and a writing section in Phase 2.
