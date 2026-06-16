# Athena White Paper + Notes Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a sanitized, human-voiced white paper on the *athena* investigation/eval pipeline as the first entry in a new `/notes` section of lhocke.dev.

**Architecture:** A new Astro **MDX content collection** (`notes`) renders through a dedicated `ArticleLayout` (white-paper masthead + zero-JS sticky TOC + reading column). Prose is authored in MDX with embedded Astro components (diagrams, callouts) so one source can later produce a PDF. The athena project card repoints to the article; a "Notes" nav link launches the section. The `verify-site.mjs` gate is extended to assert the new routes/links, a leak denylist, and a banned-AI-tell grep.

**Tech Stack:** Astro 6, Tailwind v4 (`@theme` tokens in `src/styles/global.css`), `@astrojs/mdx`, Cloudflare Pages (deploy on push to `main`).

**Spec:** `docs/superpowers/specs/2026-06-15-athena-white-paper-design.md`. **Voice/anti-slop discipline:** project `CLAUDE.md` (canonical) + spec §5.5.

---

## Critical workflow constraints (read before starting)

- **All work stays on the `feat/athena-white-paper` branch.** Nothing touches `main` without Dylan's explicit "go" (push to `main` = deploy). The final merge is Task 16, gated on his approval.
- **Gates before any commit that completes a task:** `npm run check` (astro check) must pass; at phase boundaries also `npm run verify` (build + `scripts/verify-site.mjs`).
- **No unit-test runner exists.** "Tests" = `npm run check` + `verify-site.mjs` assertions. Where this plan says "write the failing check," that means a verifier assertion.
- **Voice is human-gated.** Phases 2–3 (content) are NOT autonomous codegen. Dylan owns final copy; the calibration loop and anti-slop pass are mandatory. Subagents drafting prose MUST follow the project `CLAUDE.md` voice section.
- **Zero-JS budget.** No client JS may be added (protects Lighthouse). The TOC is CSS-only (static anchors + `position:sticky`).

---

## File Structure

**Create:**
- `src/content/notes/athena-investigation-pipeline.mdx` — the paper (stub first, authored in Phase 3).
- `src/layouts/ArticleLayout.astro` — white-paper shell (masthead + TOC rail + reading column).
- `src/components/notes/SourceTags.astro` — source-tool pills.
- `src/components/notes/Abstract.astro` — masthead abstract box.
- `src/components/notes/Takeaway.astro` — per-section takeaway callout.
- `src/components/notes/OnThisPage.astro` — sticky TOC (zero-JS).
- `src/components/notes/diagrams/*.astro` — 6 inline-SVG diagram components (Phase 4).
- `src/pages/notes/index.astro` — Notes section index.
- `src/pages/notes/[...slug].astro` — article renderer.

**Modify:**
- `astro.config.mjs` — add `@astrojs/mdx` integration.
- `src/content.config.ts` — add `notes` collection.
- `src/layouts/BaseLayout.astro` — add optional `wide` prop (for the TOC-rail width).
- `src/styles/global.css` — add `.note-prose` article-body styles + `.note-toc` sticky helper.
- `src/components/Nav.astro` — add the "Notes" link.
- `src/content/projects/3-athena.md` — add `href` + `linkLabel`.
- `scripts/verify-site.mjs` — new route/link/denylist/banned-tell assertions.

---

# PHASE 1 — Notes infrastructure (machinery + stub content)

Goal: a navigable, building, verifier-green `/notes` section with a placeholder article. No real prose yet.

## Task 1: Add the MDX integration

**Files:** Modify `astro.config.mjs`

- [ ] **Step 1: Install the integration**

Run: `npm install @astrojs/mdx`
Expected: adds `@astrojs/mdx` to `dependencies`, no peer-dep errors.

- [ ] **Step 2: Wire it into the config**

Replace `astro.config.mjs` with:

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://lhocke.dev',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Verify build still works**

Run: `npm run check && npm run build`
Expected: both succeed; no new errors.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs package.json package-lock.json
git commit -m "Add @astrojs/mdx integration for the Notes section"
```

## Task 2: Add the `notes` content collection

**Files:** Modify `src/content.config.ts`

- [ ] **Step 1: Add the collection + schema**

Replace `src/content.config.ts` with:

```ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    tag: z.string(),              // e.g. "Live · Playable"
    blurb: z.string(),
    href: z.string().optional(),  // omitted = no outbound link
    linkLabel: z.string().optional(),
    order: z.number(),
  }),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),                       // italic kicker under the title
    abstract: z.string(),                  // TL;DR box + meta description
    tags: z.array(z.string()).default([]), // source-tool pills
    publishDate: z.coerce.date().optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),     // excluded from the index in prod
  }),
});

export const collections = { projects, notes };
```

- [ ] **Step 2: Verify types**

Run: `npm run check`
Expected: PASS (collection compiles; no consumers yet).

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "Add notes content collection schema"
```

## Task 3: Stub article (so routes render + verifier has a target)

**Files:** Create `src/content/notes/athena-investigation-pipeline.mdx`

- [ ] **Step 1: Create the stub**

```mdx
---
title: "Build the thing, then prove it works"
dek: "a multi-source investigation pipeline — and the evals that keep it honest"
abstract: "PLACEHOLDER — replaced in Phase 3. A walkthrough of a multi-source investigation pipeline and the evaluation rigor behind it."
tags: ["BigQuery", "Datadog", "Slack", "Notion", "Jira", "Zendesk"]
order: 1
draft: true
---

## The problem

PLACEHOLDER — content authored in Phase 3.

## Why specialized agents

PLACEHOLDER — first calibration section (Phase 2).

## Proving it works

PLACEHOLDER.
```

> NOTE: `draft: true` keeps it out of the index listing in prod but the page still builds (getStaticPaths renders all). Flipped to `false` at ship (Task 15). "PLACEHOLDER" strings are removed before ship and the verifier (Task 9) fails if they survive in built output.

- [ ] **Step 2: Commit**

```bash
git add src/content/notes/athena-investigation-pipeline.mdx
git commit -m "Add stub Notes article for athena (placeholder content)"
```

## Task 4: Presentational components (SourceTags, Abstract, Takeaway)

**Files:** Create `src/components/notes/SourceTags.astro`, `src/components/notes/Abstract.astro`, `src/components/notes/Takeaway.astro`

- [ ] **Step 1: SourceTags.astro** (mirrors the zork.astro pill pattern)

```astro
---
interface Props { tags: string[]; }
const { tags } = Astro.props;
---
{tags.length > 0 && (
  <ul class="mt-5 flex list-none flex-wrap gap-2 p-0">
    {tags.map((t) => (
      <li class="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted">{t}</li>
    ))}
  </ul>
)}
```

- [ ] **Step 2: Abstract.astro**

```astro
---
interface Props { abstract: string; }
const { abstract } = Astro.props;
---
<div class="my-6 border-l-2 border-line pl-4">
  <p class="font-mono text-xs uppercase tracking-widest text-faint">Abstract</p>
  <p class="mt-1 text-muted leading-relaxed">{abstract}</p>
</div>
```

- [ ] **Step 3: Takeaway.astro** (used inside MDX via `<Takeaway>…</Takeaway>`)

```astro
---
// Per-section takeaway callout. Slot carries the text.
---
<aside class="my-6 border-l-2 border-accent pl-4">
  <p class="font-mono text-xs uppercase tracking-widest text-accent">Takeaway</p>
  <div class="mt-1 text-muted leading-relaxed"><slot /></div>
</aside>
```

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/notes/
git commit -m "Add Notes presentational components (SourceTags, Abstract, Takeaway)"
```

## Task 5: OnThisPage TOC component (zero-JS)

**Files:** Create `src/components/notes/OnThisPage.astro`

- [ ] **Step 1: Create it** (consumes Astro's `headings` from `render()`)

```astro
---
interface Heading { depth: number; slug: string; text: string; }
interface Props { headings: Heading[]; }
const { headings } = Astro.props;
const items = headings.filter((h) => h.depth === 2); // h2 sections only
---
{items.length > 0 && (
  <nav aria-label="On this page" class="text-sm">
    <p class="font-mono text-xs uppercase tracking-widest text-faint">On this page</p>
    <ul class="mt-2 list-none space-y-1.5 p-0">
      {items.map((h) => (
        <li><a href={`#${h.slug}`} class="text-muted transition-colors hover:text-ink">{h.text}</a></li>
      ))}
    </ul>
  </nav>
)}
```

> NOTE: no scroll-spy / active-highlight — that needs JS and is explicitly out of scope (spec §8). Static anchors only.

- [ ] **Step 2: Verify**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/notes/OnThisPage.astro
git commit -m "Add zero-JS OnThisPage TOC component"
```

## Task 6: ArticleLayout + BaseLayout `wide` prop + article-body styles

**Files:** Create `src/layouts/ArticleLayout.astro`; Modify `src/layouts/BaseLayout.astro`, `src/styles/global.css`

- [ ] **Step 1: Add a `wide` prop to BaseLayout** (the article needs more than `max-w-2xl` for the TOC rail)

In `src/layouts/BaseLayout.astro`, extend the Props interface and the `<main>` class. Change the Props interface to:

```ts
interface Props {
  title?: string;
  description?: string;
  wide?: boolean;
}
```

Destructure `wide = false` alongside the existing props, and change the `<main>` element to:

```astro
<main class:list={["mx-auto px-6 py-12 sm:py-16", wide ? "max-w-5xl" : "max-w-2xl"]}>
  <slot />
</main>
```

(Everything else in BaseLayout stays. `wide` defaults false → all existing pages unchanged.)

- [ ] **Step 2: Add article-body + TOC styles to `src/styles/global.css`**

Append to `src/styles/global.css` (uses the existing `@theme` tokens):

```css
/* ---- Notes article body ---- */
.note-prose {
  line-height: 1.75;
  color: var(--color-muted);
}
.note-prose h2 {
  font-family: var(--font-serif);
  color: var(--color-ink);
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 0.75rem;
  scroll-margin-top: 1.5rem;
}
.note-prose h3 {
  font-family: var(--font-serif);
  color: var(--color-ink);
  font-size: 1.2rem;
  font-weight: 600;
  margin-top: 1.75rem;
  margin-bottom: 0.5rem;
}
.note-prose p { margin: 1rem 0; }
.note-prose a { color: var(--color-accent); text-decoration: underline; }
.note-prose strong { color: var(--color-ink); font-weight: 600; }
.note-prose ul, .note-prose ol { margin: 1rem 0; padding-left: 1.25rem; }
.note-prose li { margin: 0.35rem 0; }
.note-prose code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.875em;
  background: #f5f5f4;            /* stone-100, AA-safe with ink */
  padding: 0.1em 0.35em;
  border-radius: 4px;
}
.note-prose pre {
  background: var(--color-ink);
  color: var(--color-paper);
  padding: 1rem 1.1rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.6;
}
.note-prose pre code { background: transparent; padding: 0; }
.note-prose blockquote {
  border-left: 2px solid var(--color-line);
  padding-left: 1rem;
  font-style: italic;
  color: var(--color-faint);
}
```

- [ ] **Step 3: Create `src/layouts/ArticleLayout.astro`**

```astro
---
import BaseLayout from "./BaseLayout.astro";
import Footer from "../components/Footer.astro";
import Abstract from "../components/notes/Abstract.astro";
import SourceTags from "../components/notes/SourceTags.astro";
import OnThisPage from "../components/notes/OnThisPage.astro";

interface Heading { depth: number; slug: string; text: string; }
interface Props {
  title: string;
  dek: string;
  abstract: string;
  tags: string[];
  headings: Heading[];
  description?: string;
}
const { title, dek, abstract, tags, headings, description } = Astro.props;
---
<BaseLayout title={`${title} — Dylan Ishihara`} description={description ?? abstract} wide>
  <a href="/notes" class="font-mono text-xs text-faint transition-colors hover:text-ink">← notes</a>

  <header class="mt-6 mb-8 border-b border-line pb-8">
    <h1 class="font-serif text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
    <p class="mt-2 font-serif italic text-accent">{dek}</p>
    <Abstract abstract={abstract} />
    <SourceTags tags={tags} />
  </header>

  <div class="lg:grid lg:grid-cols-[11rem_1fr] lg:gap-12">
    <div class="mb-8 lg:mb-0">
      <div class="lg:sticky lg:top-12">
        <OnThisPage headings={headings} />
      </div>
    </div>
    <article class="note-prose max-w-2xl">
      <slot />
    </article>
  </div>

  <Footer />
</BaseLayout>
```

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/ArticleLayout.astro src/layouts/BaseLayout.astro src/styles/global.css
git commit -m "Add ArticleLayout (masthead + sticky TOC) + article-body styles"
```

## Task 7: Routes — Notes index + article renderer

**Files:** Create `src/pages/notes/index.astro`, `src/pages/notes/[...slug].astro`

- [ ] **Step 1: `src/pages/notes/index.astro`**

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import Nav from "../../components/Nav.astro";
import Footer from "../../components/Footer.astro";

const notes = (await getCollection("notes", ({ data }) => (import.meta.env.PROD ? !data.draft : true)))
  .sort((a, b) => a.data.order - b.data.order);
---
<BaseLayout
  title="Notes — Dylan Ishihara"
  description="Occasional long-form on building and evaluating AI tooling, and the craft of software."
>
  <Nav />
  <header class="mt-10 mb-8">
    <p class="font-serif italic text-accent mb-2">Notes</p>
    <h1 class="font-serif text-3xl font-semibold text-ink">Writing</h1>
    <p class="mt-2 text-muted leading-relaxed">
      Occasional long-form on building and evaluating AI tooling — and the craft of software that lasts.
    </p>
  </header>

  {notes.length === 0 ? (
    <p class="text-muted">Nothing published yet.</p>
  ) : (
    <ul class="list-none space-y-6 p-0">
      {notes.map((note) => (
        <li class="border-b border-line pb-6">
          <a href={`/notes/${note.id}`} class="group block">
            <h2 class="font-serif text-xl font-medium text-ink transition-colors group-hover:text-accent">{note.data.title}</h2>
            <p class="mt-1 font-serif italic text-accent">{note.data.dek}</p>
            <p class="mt-2 text-muted leading-relaxed">{note.data.abstract}</p>
          </a>
        </li>
      ))}
    </ul>
  )}

  <Footer />
</BaseLayout>
```

- [ ] **Step 2: `src/pages/notes/[...slug].astro`**

```astro
---
import { getCollection, render } from "astro:content";
import ArticleLayout from "../../layouts/ArticleLayout.astro";

export async function getStaticPaths() {
  const notes = await getCollection("notes"); // render all (incl. drafts) so pages are reachable
  return notes.map((note) => ({
    params: { slug: note.id },
    props: { note },
  }));
}

const { note } = Astro.props;
const { Content, headings } = await render(note);
---
<ArticleLayout
  title={note.data.title}
  dek={note.data.dek}
  abstract={note.data.abstract}
  tags={note.data.tags}
  headings={headings}
>
  <Content />
</ArticleLayout>
```

- [ ] **Step 3: Verify build + eyeball locally**

Run: `npm run check && npm run build`
Expected: PASS; `dist/notes/index.html` and `dist/notes/athena-investigation-pipeline/index.html` exist.
Run: `ls dist/notes && ls dist/notes/athena-investigation-pipeline`
Expected: both contain `index.html`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/notes/
git commit -m "Add Notes routes (index + article renderer)"
```

## Task 8: Wiring — repoint athena card + add Notes nav link

**Files:** Modify `src/content/projects/3-athena.md`, `src/components/Nav.astro`

- [ ] **Step 1: Repoint the athena card** — add two frontmatter fields to `src/content/projects/3-athena.md`:

```yaml
href: "/notes/athena-investigation-pipeline"
linkLabel: "Read the white paper"
```

(Place them after `blurb`, before `order`. ProjectCard renders an internal link — no `target=_blank` — because the href does not start with `http`.)

- [ ] **Step 2: Add the Notes nav link** — in `src/components/Nav.astro`, inside `<div class="flex gap-6">`, add as the last link:

```astro
<a href="/notes" class="hover:text-ink transition-colors">Notes</a>
```

- [ ] **Step 3: Verify**

Run: `npm run check && npm run build`
Expected: PASS. `dist/index.html` contains `href="/notes"` and `href="/notes/athena-investigation-pipeline"`.

- [ ] **Step 4: Commit**

```bash
git add src/content/projects/3-athena.md src/components/Nav.astro
git commit -m "Wire athena card to /notes article + add Notes nav link"
```

## Task 9: Extend the verifier (routes, links, leak denylist, banned-tell grep)

**Files:** Modify `scripts/verify-site.mjs`

> Pattern reference (from the existing file): `load(relPath)` returns `{ raw, text }` where `raw` = full lowercased HTML (includes hrefs) and `text` = stripped visible text. Errors collect into `errors[]`; the script `process.exit(1)` if any. The file already loads `index.html` and `zork/index.html` into a `pages` set that builds `allText`/`allRaw`.

- [ ] **Step 1: Load the Notes pages** — after the existing `load("zork/index.html")`, add:

```js
const notesIndex = load("notes/index.html");
const athenaPaper = load("notes/athena-investigation-pipeline/index.html");
```

Add both to the array that builds `allText`/`allRaw` (so the existing job-search denylist also scans them).

- [ ] **Step 2: Write the route + link assertions** (these should PASS now — Tasks 7–8 created the targets):

```js
// --- Notes section structure ---
if (!notesIndex) errors.push("MISSING page: dist/notes/index.html (the /notes route)");
if (!athenaPaper) errors.push("MISSING page: dist/notes/athena-investigation-pipeline/index.html");

// Homepage must link to the section and the paper
if (index && !index.raw.includes('href="/notes"')) {
  errors.push('MISSING nav link to /notes on the homepage');
}
if (index && !index.raw.includes('href="/notes/athena-investigation-pipeline"')) {
  errors.push('MISSING athena card link to the white paper');
}
```

- [ ] **Step 3: Confirm the assertions actually bite** — temporarily remove the Notes nav link from `Nav.astro`, run `npm run verify`, confirm it FAILS with "MISSING nav link to /notes", then restore the link.

Run: `npm run verify`
Expected (with link removed): FAIL. Expected (restored): PASS.

- [ ] **Step 4: Add the placeholder guard** (fails if stub text survives to ship):

```js
// --- No placeholder content shipped ---
for (const p of [notesIndex, athenaPaper].filter(Boolean)) {
  if (p.text.includes("placeholder")) {
    errors.push("PLACEHOLDER text present in a Notes page — author real content before shipping");
  }
}
```

> This is EXPECTED to fail while the stub is in place — that is correct. It becomes a real gate in Phase 3. To keep Phase 1 green, gate it behind an env flag: only enforce when `process.env.NOTES_READY === "1"`. Document that Task 15 sets `NOTES_READY=1`.

- [ ] **Step 5: Add the leak denylist** (real names kept OUT of the repo — sourced from env; spec §9):

```js
// --- Sanitization: no real client/employer/internal-system names in Notes ---
const DENYLIST = (process.env.NOTES_DENYLIST || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
for (const p of [notesIndex, athenaPaper].filter(Boolean)) {
  for (const term of DENYLIST) {
    if (p.raw.includes(term)) errors.push(`LEAK: forbidden term "${term}" present in a Notes page`);
  }
}
if (DENYLIST.length === 0) {
  console.warn("verify-site: NOTES_DENYLIST not set — leak check skipped (set it locally/CI before ship)");
}
```

- [ ] **Step 6: Add the banned-AI-tell grep** (scans visible Notes text; spec §5.5 / CLAUDE.md):

```js
// --- Anti-slop: banned LLM tells in Notes prose ---
const BANNED_TELLS = [
  "delve", "leverage", "seamless", "tapestry", "testament to",
  "navigate the complexities", "game-changer", "deep dive",
  "it's worth noting", "in conclusion", "at the end of the day",
];
for (const p of [notesIndex, athenaPaper].filter(Boolean)) {
  for (const tell of BANNED_TELLS) {
    if (p.text.includes(tell)) errors.push(`AI-SLOP tell present in a Notes page: "${tell}"`);
  }
}
```

> Keep the list conservative (egregious, unambiguous tells) to avoid false positives. Holistic slop judgment stays with the anti-slop review pass + Dylan's edit.

- [ ] **Step 7: Phase-1 gate**

Run: `npm run verify`
Expected: PASS (placeholder guard is behind `NOTES_READY`, denylist warns-not-fails when unset).

- [ ] **Step 8: Commit**

```bash
git add scripts/verify-site.mjs
git commit -m "Extend verifier: Notes routes/links, leak denylist, banned-tell grep"
```

**✅ PHASE 1 GATE:** `npm run check` + `npm run verify` green; `/notes` and the athena paper render with the masthead, TOC, and tags; homepage links resolve. The section is live-shaped with placeholder prose. **Do not merge to main.**

---

# PHASE 2 — Voice calibration (HUMAN-GATED checkpoint)

Goal: lock the register against Dylan's real voice before drafting the whole paper. This is not autonomous codegen.

## Task 10: Calibrate on the "Why specialized agents" section

**Files:** Modify `src/content/notes/athena-investigation-pipeline.mdx` (one section)

- [ ] **Step 1:** Re-read the project `CLAUDE.md` voice section and Appendix A of the spec (Dylan's cold sample). These are the ground truth — NOT the existing site copy.

- [ ] **Step 2:** Draft ONLY the "Why specialized agents" section (~150–250 words) in the calibrated register: conviction-first opener, accretive cadence, plain/deflating diction, anti-waste lens, minimal enumeration. Seed it from Dylan's Appendix-A answer to the specialized-agents question. Present it explicitly as "raw for heavy edit."

- [ ] **Step 3 (Dylan):** Dylan edits the section hard, in the file.

- [ ] **Step 4:** Diff Dylan's edit against the draft. Extract concrete voice deltas (word choices, sentence-length changes, things cut). If they refine the anchors, update `CLAUDE.md` §"Voice & content" and spec §5.5. Commit any anchor updates.

- [ ] **Step 5: Gate (Dylan):** Dylan confirms the section reads as his voice before Phase 3 begins. Do not proceed without it.

```bash
git add src/content/notes/athena-investigation-pipeline.mdx CLAUDE.md docs/superpowers/specs/2026-06-15-athena-white-paper-design.md
git commit -m "Calibrate Notes voice on the specialized-agents section"
```

---

# PHASE 3 — Content authoring (HUMAN-GATED)

Goal: the full paper in calibrated voice, sanitized, anti-slop-clean.

## Task 11: Draft the full paper

**Files:** Modify `src/content/notes/athena-investigation-pipeline.mdx`

- [ ] **Step 1:** Draft all sections per spec §5 (two-act + coda + optional FAQ), applying the Phase-2 calibration. Where Dylan has supplied raw bullet thoughts for a section, shape those rather than inventing claims. Mark diagram insertion points with HTML comments (`{/* DIAGRAM: pipeline */}`) — components wired in Phase 4. Keep all concrete entities/numbers synthetic and explicitly labeled illustrative.
- [ ] **Step 2:** Write a real `abstract` and `dek` in the frontmatter (remove placeholder text).
- [ ] **Step 3:** `npm run check && npm run build`; eyeball locally. Commit ("Draft athena white paper — raw for edit").

## Task 12: Dylan's edit + anti-slop review pass

- [ ] **Step 1 (Dylan):** Heavy edit pass for voice + accuracy. Dylan owns final copy.
- [ ] **Step 2:** Independent anti-slop review pass (a fresh subagent reading ONLY for AI tells against the CLAUDE.md banned list + holistic slop; report, don't auto-rewrite). Apply accepted fixes.
- [ ] **Step 3:** Set `NOTES_READY=1` and run `npm run verify` — the placeholder guard and banned-tell grep must be green.

Run: `NOTES_READY=1 npm run verify`
Expected: PASS (no placeholder text, no banned tells).
- [ ] **Step 4:** Commit ("Edit + anti-slop pass on athena white paper").

## Task 13: Finalize the synthetic worked example

- [ ] **Step 1:** Lock the worked-example specifics (synthetic entities, the eval results-table numbers, the structured-output JSON example) so diagrams can match. Confirm everything is fabricated + labeled illustrative.
- [ ] **Step 2:** `NOTES_READY=1 npm run verify`; commit.

---

# PHASE 4 — Diagrams

Goal: the 6 Editorial-line SVG diagrams (spec §6), zero-JS, AA-contrast, with text alternatives.

## Task 14: Build the diagram components

**Files:** Create `src/components/notes/diagrams/{Pipeline,Redaction,StructuredOutput,WorkflowSequence,EvalHarness,RightSizing}.astro`; embed in the MDX.

**Style contract (all diagrams):** inline `<svg>` only; palette = paper `#fafaf9` bg, ink `#1c1917` text/strokes via hairline (`#d6d3d1`), teal `#0f766e` connectors/accent; serif node labels; every SVG carries a `<title>` (and `role="img"` + `aria-label`) for accessibility; verify each text/stroke pair meets WCAG AA. Reference: the approved "Editorial line" mockup (Direction A) from the brainstorm session.

- [ ] **Step 1: `Pipeline.astro`** (content-independent — build first as the style template). Canonical flow: the six sources → specialized agents → correlate → **validate (with feedback loop back to agents)** → redact → structured output. Starter SVG to adapt:

```astro
---
// Canonical athena pipeline. Editorial-line style, zero-JS.
---
<figure class="my-8">
  <svg viewBox="0 0 560 220" role="img" aria-label="Pipeline: six sources feed specialized agents, which correlate, self-validate in a loop, redact, then emit structured output." class="w-full" font-family="Georgia, serif">
    <title>athena pipeline architecture</title>
    <defs>
      <marker id="ar" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6" fill="none" stroke="#0f766e" stroke-width="1.1" />
      </marker>
    </defs>
    <!-- Author the nodes/edges to the final design; see style contract above. -->
  </svg>
  <figcaption class="mt-2 text-center font-mono text-xs text-faint">Specialized agents → correlate → self-validate → redact → structured output.</figcaption>
</figure>
```

> The full node/edge geometry is authored here against the final design (kept out of this plan because it's a design-authoring step, not boilerplate). Use the brainstorm mockup's Option-A SVG as the geometric starting point.

- [ ] **Step 2:** `Redaction.astro` — before/after panel on synthetic text (styled HTML/CSS acceptable; not required to be SVG).
- [ ] **Step 3:** `StructuredOutput` — render the sanitized JSON as a fenced code block in the MDX (no component needed) OR a small component; ensure `.note-prose pre` styles apply.
- [ ] **Step 4:** `WorkflowSequence.astro` — the end-to-end synthetic case incl. the self-validation loop (matches Task 13's locked example).
- [ ] **Step 5:** `EvalHarness.astro` — fixtures → blind grade → score across models. (Schematic/blueprint variant permitted here per spec.)
- [ ] **Step 6:** `RightSizing.astro` — results table (synthetic numbers from Task 13), models × tasks, local vs cloud. A styled HTML `<table>` is fine.
- [ ] **Step 7:** Import each into the MDX at its insertion point; replace the `{/* DIAGRAM */}` markers.
- [ ] **Step 8: Verify + a11y check**

Run: `NOTES_READY=1 npm run verify`
Expected: PASS. Manually confirm every SVG has a `<title>`/`aria-label` and AA contrast.
- [ ] **Step 9:** Commit ("Add athena white-paper diagrams").

---

# PHASE 5 — Final integration & ship

## Task 15: Full verification + production-readiness

- [ ] **Step 1:** Flip the article frontmatter `draft: true` → `draft: false` (now lists in the index).
- [ ] **Step 2:** Full gate with all guards on:

Run: `npm run check && NOTES_READY=1 NOTES_DENYLIST="<real-terms-here>" npm run verify`
Expected: PASS — no placeholder, no banned tells, no leaked terms; routes + links present.

> Dylan supplies `NOTES_DENYLIST` (real client/employer/internal names) at run time so the terms never enter git.

- [ ] **Step 3:** Push the branch; review the Cloudflare **preview** deploy. Run Lighthouse on the preview `/notes/athena-investigation-pipeline`. Expected: Perf/A11y/Best-Practices ~100. (SEO ~92 on prod is the known benign Content-Signal artifact — do not chase. Preview may show lower SEO due to the noindex header — also expected.)
- [ ] **Step 4 (Dylan):** Final read-through on preview — voice, sanitization, diagrams, links, mobile TOC collapse.
- [ ] **Step 5:** Commit ("Mark athena white paper ready (draft: false)").

## Task 16: Merge to main (GATED on Dylan's explicit "go")

- [ ] **Step 1:** Get Dylan's explicit "go."
- [ ] **Step 2:** Fast-forward / rebase-merge `feat/athena-white-paper` → `main`; push (triggers deploy).

```bash
git -C /Users/lhocke/Code/portfolio checkout main
git -C /Users/lhocke/Code/portfolio merge --ff-only feat/athena-white-paper
git -C /Users/lhocke/Code/portfolio push origin main
```

- [ ] **Step 3:** Verify production `lhocke.dev/notes/athena-investigation-pipeline` is live; re-run Lighthouse on prod. Confirm the athena card and nav link resolve.
- [ ] **Step 4:** Delete the feature branch; update `.remember` handoff.

---

## Self-Review

**Spec coverage:** Notes section/infra (Tasks 1–7) ✓ · sanitization line incl. tool-names-OK + leak denylist (Tasks 8–9, 15) ✓ · layered two-act + coda + optional FAQ (Task 11) ✓ · self-validation loop in workflow + diagram (Tasks 11, 14) ✓ · Editorial-line diagrams ×6 (Task 14) ✓ · sticky zero-JS TOC (Tasks 5–6) ✓ · MDX single-source/PDF-ready (Tasks 1–3) ✓ · voice/anti-slop discipline + calibration loop (CLAUDE.md, Tasks 10–12) ✓ · banned-tell grep + a11y AA (Tasks 9, 14) ✓ · homepage card repoint + nav (Task 8) ✓. Deferred per spec §8 (PDF gen, scroll-spy, extra articles) — correctly absent.

**Placeholder scan:** Intentional placeholders are the stub article (Task 3) and the diagram geometry (Task 14) — both are sequencing decisions (content/design authored in their phase), explicitly gated by the verifier's placeholder guard, not unfilled plan steps. No "TBD/handle edge cases" hand-waving in code steps.

**Type consistency:** `notes` schema fields (`title/dek/abstract/tags/order/draft`) match ArticleLayout Props and the route usage; `note.id` used consistently for slug + link; `headings` shape (`{depth,slug,text}`) matches OnThisPage + `render()`. BaseLayout `wide` prop added and consumed by ArticleLayout only.
