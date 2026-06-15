# Live Zork Terminal Embed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `/zork` route that frames the ZIL→TypeScript Zork port and embeds the live game (`zork.lhocke.dev`) behind a click-to-start facade, and repoint the homepage card to it.

**Architecture:** A new Astro page (`src/pages/zork.astro`) reuses `BaseLayout` + `Footer`, renders an honest build-story, and hosts a `ZorkTerminal.astro` component. The component shows a themed poster whose **Play** control is a real `<a href="https://zork.lhocke.dev">`; a tiny vanilla script swaps in an `<iframe>` on click (progressive enhancement — if JS is off or the iframe fails, the link opens the live game full-screen). No engine is imported; the embed is fully decoupled from the `zork-workflow` repo. The site verifier (`scripts/verify-site.mjs`) is extended to cover the new route and the moved live-game link.

**Tech Stack:** Astro ^6.4.6, Tailwind CSS v4 (`@theme` tokens in `src/styles/global.css`), Cloudflare Pages (Git-connected). No new dependencies.

**Branch & deploy discipline:** All work on `feat/zork-embed` (already created & pushed). **Never commit to `main`** — push-to-`main` auto-deploys production; feature-branch pushes produce Cloudflare *preview* builds. Merge only after `check` + `verify` + Lighthouse pass.

**Spec:** `docs/superpowers/specs/2026-06-15-zork-terminal-embed-design.md`

---

## File Structure

- **Create** `src/components/ZorkTerminal.astro` — the facade exhibit: poster + Play link + the click-to-swap `<iframe>` script. One responsibility: present and lazily load the embedded game. Props: `src` (game URL), `title` (iframe a11y title).
- **Create** `src/pages/zork.astro` — the `/zork` route: back link, title + kicker, build-story, `<ZorkTerminal>`, context chips, full-screen link, deferred (flagged-off) source link, `Footer`. Owns page content + meta.
- **Modify** `src/content/projects/1-zork.md` — repoint the homepage card `href` from `https://zork.lhocke.dev` → `/zork`; update `linkLabel`.
- **Modify** `scripts/verify-site.mjs` — scan both `dist/index.html` and `dist/zork/index.html`; make required-content/forbidden-signal checks site-wide (robust to which page hosts which); add `/zork` structural guarantees and the homepage→`/zork` link check.

No other files change. `BaseLayout`, `Footer`, `ProjectCard`, `Projects`, and the design tokens in `global.css` are reused as-is.

---

## Task 1: Extend the verifier (write the failing guards first)

The repo has no unit-test runner; `scripts/verify-site.mjs` *is* the test suite. Encode the new guarantees first so they fail RED, then implement to GREEN. This also formalizes the moved-link gotcha (the homepage no longer carries `zork.lhocke.dev`).

**Files:**
- Modify: `scripts/verify-site.mjs` (full rewrite below)

- [ ] **Step 1: Rewrite the verifier to cover both routes**

Replace the entire contents of `scripts/verify-site.mjs` with:

```js
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";

// Load a built page as { raw, text }, or null if it wasn't emitted.
// `text` = visible text only (tags stripped) — used to scan for job-search signals.
// `raw`  = full HTML incl. href attributes — used to confirm required links/content.
function load(relPath) {
  const full = join(DIST, relPath);
  if (!existsSync(full)) return null;
  const html = readFileSync(full, "utf8");
  return {
    raw: html.toLowerCase(),
    text: html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").toLowerCase(),
  };
}

const errors = [];

const index = load("index.html");
const zork = load("zork/index.html");

if (!index) errors.push("MISSING page: dist/index.html");
if (!zork) errors.push("MISSING page: dist/zork/index.html (the /zork route)");

// Site-wide corpora — robust to which page hosts which content.
const pages = [index, zork].filter(Boolean);
const allText = pages.map((p) => p.text).join(" ");
const allRaw = pages.map((p) => p.raw).join(" ");

// 1. No active-job-search signals (spec §2 hard constraint) — on EVERY page.
const FORBIDDEN = [
  "open to work", "looking for", "seeking a", "seeking new", "actively seeking",
  "hire me", "available for hire", "available for work", "job search",
  "job-seeking", "currently looking", "new opportunity",
];
for (const phrase of FORBIDDEN) {
  if (allText.includes(phrase)) errors.push(`FORBIDDEN job-search signal present: "${phrase}"`);
}

// 2. Required content present somewhere on the site.
const REQUIRED = [
  "dylan ishihara",
  "zork.lhocke.dev",
  "github.com/lhocke/zendesk-mcp-server",
  "pantheon.lhocke.dev",
  "dylan.ishihara@gmail.com",
  "linkedin.com/in/dylan-ishihara",
];
for (const needle of REQUIRED) {
  if (!allRaw.includes(needle.toLowerCase())) errors.push(`MISSING required content: "${needle}"`);
}

// 3. Résumé asset shipped and linked from the homepage.
if (!existsSync(join(DIST, "resume.pdf"))) errors.push("MISSING asset: dist/resume.pdf");
if (index && !index.raw.includes("/resume.pdf")) errors.push("MISSING link to /resume.pdf");

// 4. athena must remain unlinked (private/unsanitized — spec §7).
if (allRaw.includes("lhocke/athena")) errors.push("LEAK: athena repo link present (must stay unlinked)");

// 5. /zork route guarantees (Phase 2).
if (zork) {
  if (!zork.raw.includes("zil")) errors.push("/zork: MISSING build-story marker 'ZIL'");
  if (!zork.raw.includes("typescript")) errors.push("/zork: MISSING build-story marker 'TypeScript'");
  if (!zork.raw.includes("zork.lhocke.dev")) errors.push("/zork: MISSING live-game link to zork.lhocke.dev");
}

// 6. Homepage Zork card points at the internal /zork route.
if (index && !index.raw.includes('href="/zork"')) {
  errors.push('MISSING homepage card link to /zork (href="/zork")');
}

if (errors.length) {
  console.error("❌ verify-site failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("✅ verify-site passed: both routes, no job-search signals, all required content present.");
```

- [ ] **Step 2: Run the verifier to confirm it fails RED**

Run: `npm run verify`
Expected: build succeeds, then FAIL with at least:
```
❌ verify-site failed:
  - MISSING page: dist/zork/index.html (the /zork route)
  - MISSING homepage card link to /zork (href="/zork")
```
(The `zork.lhocke.dev` REQUIRED check still passes here because the homepage card is still external — that flips in Task 3.)

- [ ] **Step 3: Commit**

```bash
git -C /Users/lhocke/Code/portfolio add scripts/verify-site.mjs
git -C /Users/lhocke/Code/portfolio commit -m "test: extend verifier for /zork route and moved live-game link"
```

---

## Task 2: Build the terminal exhibit component

A self-contained facade. It compiles independently (`astro check`) but isn't wired to a route until Task 3, so `npm run verify` stays RED through this task — that's expected.

**Files:**
- Create: `src/components/ZorkTerminal.astro`

- [ ] **Step 1: Create the component**

Create `src/components/ZorkTerminal.astro` with exactly:

```astro
---
interface Props {
  src?: string;
  title?: string;
}
const {
  src = "https://zork.lhocke.dev",
  title = "Zork — a playable text adventure, running live",
} = Astro.props;
const host = src.replace(/^https?:\/\//, "");
---
<div class="overflow-hidden rounded-xl border border-line bg-[#0c0a09]" data-zork-src={src} data-zork-title={title}>
  <div data-zork-poster>
    <div class="px-4 py-3 font-mono text-[13px] leading-relaxed text-[#a8a29e] select-none" aria-hidden="true">
      ZORK I: The Great Underground Empire<br />
      West of House<br />
      You are standing in an open field west of a white house…<br />
      <span class="text-[#4ade80]">&gt;</span>
    </div>
    <div class="flex flex-col items-center gap-2 px-4 pt-4 pb-8">
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-mono text-sm text-paper transition-opacity hover:opacity-90"
        data-zork-play
      >
        ▶ Start the game
      </a>
      <span class="font-mono text-xs text-[#78716c]">loads {host}</span>
    </div>
  </div>
</div>

<script>
  const exhibit = document.querySelector("[data-zork-src]");
  const play = exhibit && exhibit.querySelector("[data-zork-play]");
  const poster = exhibit && exhibit.querySelector("[data-zork-poster]");
  if (exhibit && play && poster) {
    play.addEventListener("click", (e) => {
      // Let modified clicks (cmd/ctrl/shift/middle) open the full game in a new tab.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      const iframe = document.createElement("iframe");
      iframe.src = exhibit.getAttribute("data-zork-src");
      iframe.title = exhibit.getAttribute("data-zork-title");
      iframe.setAttribute("loading", "lazy");
      iframe.className = "block w-full rounded-xl border border-line";
      iframe.style.height = "70vh";
      poster.replaceWith(iframe);
    });
  }
</script>
```

Notes for the implementer:
- The poster background `bg-[#0c0a09]` and greens (`#4ade80`, `#a8a29e`) are intentional terminal colors, not site tokens. `bg-accent`, `text-paper`, `border-line` ARE site tokens (from `global.css`).
- Do **not** add a `sandbox` attribute — the iframe loads our own trusted origin and the game needs scripts/storage/forms.
- The Play control is a genuine `<a>` so no-JS users and load failures degrade to opening `zork.lhocke.dev` full-screen.

- [ ] **Step 2: Confirm it type-checks**

Run: `npm run check`
Expected: PASS (`0 errors`). The component compiles even though nothing imports it yet.

- [ ] **Step 3: Commit**

```bash
git -C /Users/lhocke/Code/portfolio add src/components/ZorkTerminal.astro
git -C /Users/lhocke/Code/portfolio commit -m "feat: add ZorkTerminal facade component"
```

---

## Task 3: Create the `/zork` page and repoint the homepage card

Wires the component into a route and flips the card. This is where the verifier goes GREEN.

**Files:**
- Create: `src/pages/zork.astro`
- Modify: `src/content/projects/1-zork.md`

- [ ] **Step 1: Create the page**

Create `src/pages/zork.astro` with exactly:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Footer from "../components/Footer.astro";
import ZorkTerminal from "../components/ZorkTerminal.astro";

// Flip to true once a sanitized public version of zork-workflow (no dev notes) exists.
const SHOW_SOURCE = false;
const SOURCE_URL = "https://github.com/lhocke/zork-workflow";
---
<BaseLayout
  title="Zork, ZIL → TypeScript — Dylan Ishihara"
  description="A playable port of the 1977 mainframe game Zork from its native ZIL to modern TypeScript, running live in the browser."
>
  <a href="/" class="font-mono text-xs text-faint transition-colors hover:text-ink">← back to lhocke.dev</a>

  <header class="mt-6 mb-5">
    <h1 class="font-serif text-3xl font-semibold text-ink">Zork, ZIL → TypeScript</h1>
    <p class="mt-1 font-serif text-accent italic">porting a 1977 mainframe game to the modern web</p>
  </header>

  <p class="mb-6 leading-relaxed text-muted">
    I ported the open-sourced Zork from its native ZIL — a Lisp dialect for a long-dead
    virtual machine — to modern TypeScript, working largely autonomously with an AI coding
    agent, and deployed it live. The terminal below is the real thing, running in your browser.
  </p>

  <ZorkTerminal src="https://zork.lhocke.dev" />

  <ul class="mt-5 flex list-none flex-wrap gap-2 p-0">
    <li class="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted">1977 original</li>
    <li class="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted">ZIL → TypeScript</li>
    <li class="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted">AI-assisted port</li>
    <li class="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted">Runs client-side</li>
  </ul>

  <p class="mt-6 flex gap-5 font-mono text-sm">
    <a href="https://zork.lhocke.dev" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">Open full screen ↗</a>
    {SHOW_SOURCE && (
      <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">View source ↗</a>
    )}
  </p>

  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Repoint the homepage card**

Replace the frontmatter of `src/content/projects/1-zork.md` with:

```md
---
title: "Zork, ZIL → TypeScript"
tag: "Live · Playable"
blurb: "Ported the open-sourced Zork from 1970s ZIL to modern TypeScript, largely autonomously with an AI coding tool, and deployed it live."
href: "/zork"
linkLabel: "Play it"
order: 1
---
```

(Only `href` and `linkLabel` change. `ProjectCard` renders `{linkLabel} →`, so the card reads "Play it →", and because `/zork` is not `http`, it renders as a same-tab internal link automatically.)

- [ ] **Step 3: Run the full gate — expect GREEN**

Run: `npm run check`
Expected: PASS (`0 errors`).

Run: `npm run verify`
Expected: PASS:
```
✅ verify-site passed: both routes, no job-search signals, all required content present.
```

- [ ] **Step 4: Commit**

```bash
git -C /Users/lhocke/Code/portfolio add src/pages/zork.astro src/content/projects/1-zork.md
git -C /Users/lhocke/Code/portfolio commit -m "feat: add /zork page and repoint homepage card to it"
```

---

## Task 4: Manual verification — behavior, mobile, Lighthouse

Automated gates can't confirm the facade swap, the iframe actually plays, or that scores held. Run these by hand and record results. **Browser-based tooling note:** the Lighthouse step launches headless Chrome — get Dylan's go-ahead before running it (his environment is Firefox-first), or hand him the command to run.

**Files:** none (verification only).

- [ ] **Step 1: Serve the production build locally**

Run: `npm run build && npm run preview`
Expected: preview server at `http://localhost:4321/`.

- [ ] **Step 2: Manually exercise `/zork`**

Visit `http://localhost:4321/zork` and confirm each:

- Page shows back link, title + italic kicker, build-story, the dark poster with "▶ Start the game", chips, and "Open full screen ↗".
- Clicking **Start the game** replaces the poster in place with the playable terminal; you can type a command (e.g. `open mailbox`) and get a response.
- **Cmd/Ctrl-click** on Start opens `zork.lhocke.dev` in a new tab instead (modified-click passthrough).
- The homepage (`http://localhost:4321/`) Zork card reads "Play it →" and navigates to `/zork` in the same tab.

Actual:
```text
```

- [ ] **Step 3: Mobile / narrow viewport check**

In browser devtools, set a ~375px-wide viewport and reload `/zork`. Confirm the poster, chips, and links are not clipped, and that "Open full screen ↗" is reachable. Note any cramping of the loaded iframe.

Actual:
```text
```

- [ ] **Step 4: Lighthouse on `/zork`** (with Dylan's go-ahead — launches headless Chrome)

Run: `npx lighthouse http://localhost:4321/zork --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless"`
Expected: Performance / Accessibility / Best-Practices / SEO each ≥ the Phase 1 bar (target 100s on the page shell; the iframe loads only post-click, in an isolated context, so it doesn't count against the shell).

Actual:
```text
```

- [ ] **Step 5: Record results in the plan and stop for review**

If any check fails, stop and diagnose before merging (use superpowers:systematic-debugging). Do not proceed to merge with a failing manual check.

---

## Task 5: Branch preview + merge readiness

**Files:** none.

- [ ] **Step 1: Push the branch and check the Cloudflare preview**

```bash
git -C /Users/lhocke/Code/portfolio push
```
Then open the Cloudflare Pages preview deploy for `feat/zork-embed` and visit `/zork` on the preview URL. Confirm the page renders and the game loads the same as local.

Actual:
```text
```

- [ ] **Step 2: Hand off to finishing-a-development-branch**

Do **not** merge to `main` autonomously — `main` deploys to production. Once Dylan has eyeballed the preview and approves, integrate via the superpowers:finishing-a-development-branch skill (fast-forward merge or PR, his choice), then confirm production `lhocke.dev/zork` is live and `lhocke.dev` still scores its 100s.

---

## Self-Review

**Spec coverage** (against `2026-06-15-zork-terminal-embed-design.md`):
- §4 iframe/decoupled, no new framework → Task 2 component (iframe, no engine import), plan header. ✅
- §5 `/zork` route, BaseLayout/Footer reuse, back link, composition order, canonical/meta → Task 3 page. ✅
- §6 click-to-start facade, progressive enhancement, fallback, "Trouble loading"→ full-screen → Task 2 (the full-screen link doubles as the trouble-loading escape hatch; §13 left chrome to build-time). ✅
- §7 homepage card repoint → Task 3 Step 2. ✅
- §8 mobile → Task 4 Step 3. ✅
- §9 content/chips, source-link flagged off → Task 3 page (`SHOW_SOURCE=false`). ✅
- §10 verify covers /zork + no job-search signals; check green; Lighthouse → Tasks 1, 3, 4. ✅
- §11 branch/deploy discipline, preview before merge → header + Task 5. ✅
- §12 out-of-scope honored (no source link, no editorial page, no game changes). ✅

**Placeholder scan:** no TBD/TODO; every code step shows complete content; manual steps carry `Actual:` capture blocks (no "add error handling"-style vagueness). ✅

**Type/name consistency:** `data-zork-src` / `data-zork-poster` / `data-zork-play` / `data-zork-title` attributes are defined in the Task 2 template and read by the same task's script. The page imports `ZorkTerminal` with the `src` prop defined in Task 2's `Props`. The verifier's `href="/zork"` check (Task 1 Step 1, check 6) matches the frontmatter `href: "/zork"` set in Task 3 Step 2. ✅
