# Phase 2 — Live Zork Terminal — Design Spec

*Site: `lhocke.dev` · Owner: Dylan Ishihara · Date: 2026-06-15*

## 1. Goal

Turn the Zork project from a "links out to a game" card into a focused, in-site
`/zork` page that — in about five seconds — lands the story *"this person ported a
1977 mainframe game from ZIL to modern TypeScript and shipped it live"* and lets a
visitor **play it in-page**. This is the spec's named Phase 2 "demonstrable
centerpiece" (Phase 1 spec §7, §10), realized as its own route.

## 2. Scope & Decomposition

"Phase 2" in the Phase 1 spec (§10–§11) is a *basket of independent subsystems* —
embedded Zork terminal, AI-pipeline demo, writing/articles section, dedicated
project pages, GitHub elevation, OG image, dark mode. They are not one project;
each is its own spec → plan → build cycle. **This cycle delivers the Zork embed
only.** The content-collection + per-route architecture supports the rest later
without re-platforming; sequencing them costs nothing.

## 3. Hard Constraints (inherited, non-negotiable)

All Phase 1 hard constraints (Phase 1 spec §2) apply unchanged and now extend to
the new `/zork` page:

- **No active-job-search signals** anywhere on the new page.
- **Qualitative only** — no metrics or numbers about the work.
- **Honesty** — credit the open-source origin of Zork; do not overstate
  completeness while build gaps are still being closed.
- **Sanitize** — nothing work-confidential (irrelevant here, but the rule holds).

`npm run verify` enforces these and must be extended to cover `/zork`.

## 4. Integration Approach — iframe, decoupled

`/zork` embeds the already-deployed `https://zork.lhocke.dev` in an `<iframe>`.

- **Decoupling is the point.** The live game ships from its own repo
  (`github.com/lhocke/zork-workflow`, deployed as the Cloudflare Pages project
  `zork`). An iframe means the portfolio reflects whatever is live at
  `zork.lhocke.dev` with **zero engine coupling** — as build gaps are closed, the
  embed updates for free. No vendoring, no engine sync, no portfolio redeploy.
- **No new framework.** Astro stays zero-JS on every route except a tiny vanilla
  `<script>` on this one page (the facade swap, §6). The portfolio's Lighthouse
  story is preserved.
- **Alternatives considered & rejected:**
  - *Native island* (import the engine's `createGame()` module and render a
    terminal in-portfolio): technically viable — the engine is a clean,
    DOM-free TS module — but it introduces a real engine-sync maintenance burden
    in two repos, and its main payoff (theming the terminal to the editorial
    design) is arguably an anti-feature; a Zork terminal should look like a
    terminal. Poor trade for a low-effort job-search site.
  - *Hybrid* (native chrome around an iframed interior): iframe plumbing without
    the native flex. No.

## 5. The `/zork` Page

- **Route:** `src/pages/zork.astro` → `/zork` (Astro file-based routing).
- **Chrome:** reuses `BaseLayout` (meta, fonts, design tokens) and `Footer`. A
  simple "← back to lhocke.dev" link replaces the homepage's anchored `Nav`
  (whose `#about`/`#projects` anchors don't exist on this route).
- **Composition (chosen: "Framed exhibit"):** top-to-bottom —
  1. back link
  2. title ("Zork, ZIL → TypeScript") + italic teal kicker
  3. 2–3 sentence honest build-story (§9)
  4. the terminal exhibit (§6)
  5. context chips
  6. "Open full screen ↗" link to `zork.lhocke.dev`
- **SEO/meta:** own `<title>` and description; canonical `https://lhocke.dev/zork`.
  Indexable by search engines; inherits the zone-level Cloudflare Content-Signals
  policy (search crawlers allowed, AI-training crawlers disallowed) — no per-page
  robots work needed.
- *Rejected compositions:* "Pure stage" (terminal only — too little context for a
  recruiter who doesn't know Zork); "Story-led" editorial column (the future
  writing-section upgrade — more than this cycle needs, pushes the game below the
  fold).

## 6. Terminal Exhibit — Click-to-Start Facade (`ZorkTerminal.astro`)

A static, themed **poster** with a **Play** button. The iframe is *not* present on
initial load.

- **Progressive enhancement.** The Play control is a real
  `<a href="https://zork.lhocke.dev">`. A tiny vanilla `<script>` intercepts the
  click and swaps the live `<iframe>` into the poster's place. If JS is disabled,
  or the iframe fails to load, the link simply opens the live game full-screen.
- **Why a facade:**
  - *Performance* — no iframe (and none of its ~328 KB) until the visitor opts in;
    the page shell stays near-100 Lighthouse.
  - *Intent* — the game loads only when someone chooses to play.
  - *Built-in fallback* — covers exactly the "game is mid-fix / fails to load"
    case during ongoing `zork-workflow` development: the Play link always works
    even if the embed doesn't.
- A small "Trouble loading? Open full screen ↗" affordance sits with the exhibit
  as a secondary escape hatch.

## 7. Homepage Card Change

In `src/content/projects/1-zork.md`: change `href` from the external
`https://zork.lhocke.dev` to the internal `/zork`; keep the `Live · Playable` tag
and `linkLabel` (e.g. "Play it →"). The external full-screen link relocates onto
the `/zork` page (§5). This is a single content-file edit — no component change.

## 8. Mobile

Embed everywhere — the live game is already responsive. Keep "Open full screen ↗"
prominent so phone users can jump to the standalone app for a roomier experience.
The facade already degrades to launch-out, so if the inline iframe proves cramped
on small screens during build, the escape hatch is already there.

## 9. Content (honest + safe)

Working copy (refined at build; must satisfy §3):

- **Title:** "Zork, ZIL → TypeScript"
- **Kicker (italic, teal):** e.g. "porting a 1977 mainframe game to the modern web"
- **Body:** "I ported the open-sourced Zork from its native ZIL — a Lisp dialect
  for a long-dead virtual machine — to modern TypeScript, working largely
  autonomously with an AI coding agent, and deployed it live. The terminal below
  is the real thing, running in your browser."
- **Chips:** `1977 original` · `ZIL → TypeScript` · `AI-assisted port` ·
  `Runs client-side`
- **Source link:** present in markup but **disabled** (commented / feature-flagged
  off) until a sanitized public version of `zork-workflow` — without dev notes —
  exists. Mirrors how Phase 1 handles athena: capability shown, no repo link until
  it is safe to surface. Flipping it on is a one-line change.

## 10. Verification & Gates

- **Extend `npm run verify`** to cover `/zork`: the page builds; contains the
  build-story framing; links to `zork.lhocke.dev`; and trips **zero**
  job-search signals (the hard constraint applies to the new page).
- **`npm run check`** (astro) stays green.
- **Lighthouse** re-measured on `/zork` after build — target preserves the page
  shell's 100s (the iframe loads only post-click, in an isolated context).

## 11. Branch & Deploy Discipline

The repo is **git-connected to Cloudflare Pages**: pushing to `main` auto-deploys.

- **All work on a feature branch** (`feat/zork-embed`), **never** committed to
  `main` directly.
- Merge to `main` only after `check` + `verify` + a Lighthouse pass.
- Cloudflare builds a **preview deploy** for the branch — use it to eyeball `/zork`
  live before merging.

## 12. Out of Scope (this cycle)

- Public **source link** (deferred until the sanitized public repo exists, §9).
- A written/editorial build-story page (the "Story-led" composition — future
  writing section).
- AI-pipeline demo, dark mode, OG image, GitHub elevation (other Phase 2 units).
- Any change to the live Zork game itself (`zork-workflow`) — that work lives in
  its own repo.

## 13. Open / Deferred

- Final build-story copy and kicker wording — settle during build.
- Exact terminal-exhibit chrome (border/window treatment) — iterate during build;
  it is a minor, build-time visual decision.
- Whether to add a second context line if the iframe proves visually cramped on
  the smallest breakpoints — decide from the preview deploy.

## 14. Implementation Surface (for the plan)

- **New:** `src/pages/zork.astro`; `src/components/ZorkTerminal.astro` (poster +
  facade `<script>`).
- **Changed:** `src/content/projects/1-zork.md` (`href` → `/zork`); the verifier
  script (extend to `/zork`).
- **Reused:** `BaseLayout`, `Footer`, existing design tokens in `global.css`.
