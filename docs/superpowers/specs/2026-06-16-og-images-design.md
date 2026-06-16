# OG Images — Design Spec

- **Date:** 2026-06-16
- **Status:** Approved (brainstorm) — ready for implementation plan
- **Branch:** `feat/og-images`
- **Related:** `docs/superpowers/specs/2026-06-15-athena-white-paper-design.md` (the piece this most serves)

## Problem

`BaseLayout` declares `twitter:card=summary_large_image` and emits `og:title` / `og:description` / `og:url`, but there is **no `og:image`**. Shared links (LinkedIn, Slack, iMessage) therefore render a blank/generic preview. The athena white paper was built to be shared, so a real preview card is the highest-value gap on the site.

## Goal

Per-page Open Graph preview cards, generated at **build time**, in the "Editorial Calm" style. Each page's shared link previews with its own title + dek. Constraints held:

- **Zero client JS** — generation is build-time only; pages gain meta tags, not a fetched asset, so **Lighthouse and page weight are unaffected**.
- **No active-job-search signals** anywhere in card text.
- **Sanitized content only** — card text comes from titles/deks already vetted by the content rules.

## Decisions (locked in brainstorm)

- **Strategy:** per-page dynamic cards (not one static site-wide card). Rationale: the white paper is built to be shared; a card carrying its own headline is far more clickable than a generic name card, and the build cost is modest and one-time.
- **Mechanism:** hand-rolled `satori` (layout → SVG) + `@resvg/resvg-js` (SVG → PNG) inside an Astro static endpoint. Both run **only during `astro build`**; nothing ships to the client.
  - *Rejected — `astro-og-canvas`:* template-constrained (title/description/logo/border/gradient); cannot express the footer-bar layout we chose.
  - *Rejected — `@vercel/og`:* same satori+resvg underneath but wrapped for edge/runtime use; heavier and runtime-oriented, overkill for a static build.
- **Card design:** footer-bar layout (below).

## Card design

- **Dimensions:** 1200×630 PNG.
- **Palette/type (Editorial Calm):** paper `#fafaf9` background; title in Newsreader 600, ink `#1c1917`, tight leading (~1.07), slight negative tracking; dek in Newsreader *italic*, teal `#0f766e`.
- **Footer bar:** a solid teal (`#0f766e`) bar pinned to the bottom (~70/630 of height). Bar-left = name (Inter 600, paper-white); bar-right = `lhocke.dev` (Inter, paper-white ~88%). **No top label** (it was redundant with the URL in the bar).
- **Composition:** title vertically centered in the region above the bar, dek directly beneath it.
- **Fit / overflow safety:**
  - Title size chosen by **type tier** (≈2–3 tiers keyed to title character count); a long title steps down a tier instead of overflowing.
  - The bar is structurally pinned (`flex-shrink: 0`) and the title region is `min-height: 0`, so content can never push the bar off the card (the overflow bug caught during brainstorm).

## Scope & content mapping

Every page that uses `BaseLayout` gets a card. The **home card is the default/fallback**, so `og:image` always resolves.

| Route | `og:type` | Headline | Dek | Bar-left | Bar-right |
|---|---|---|---|---|---|
| `/` | website | **Dylan Ishihara** | the site tagline | *(none)* | `lhocke.dev` |
| `/notes` | website | **Notes** | notes-index description | Dylan Ishihara | `lhocke.dev` |
| `/notes/<slug>` | article | note **title** | note **dek** | Dylan Ishihara | `lhocke.dev` |
| `/zork` | website | **Zork, ZIL → TypeScript** | short dek (trimmed from the page description) | Dylan Ishihara | `lhocke.dev` |

**Bar-left rule:** show the name **unless the headline already is the name** (homepage → bar-left empty). This is exactly the doubling removed during brainstorm.

## Content source & no-drift guarantee

The card text and the `og:image` *path* must never disagree. Mechanism:

- **`src/lib/og.ts`** owns: card dimensions, the route→card-content map for static pages (home / notes-index / zork), the `og:image` path convention, and the tier logic.
- **Notes** pull `title` / `dek` straight from the content collection — the same source the page meta description already uses.
- **`BaseLayout` derives its own `og:image` path** from `Astro.url.pathname` via `og.ts`, so pages need almost no new wiring.
- The **endpoint's `getStaticPaths()` enumerates the same routes** from the same module.
- The **build verifier asserts** every emitted `og:image` URL has a matching PNG in `dist/` — catching any path drift before deploy.

## Meta tags (extend `BaseLayout`)

Add:

- `og:image` — **absolute** URL via `new URL(path, Astro.site)` (crawlers require absolute).
- `og:image:width` = `1200`, `og:image:height` = `630`, `og:image:type` = `image/png`.
- `og:image:alt` = the card headline.
- `twitter:image` = same as `og:image`.

`og:type`: `website` by default; `ArticleLayout` passes `article` (and `article:published_time` from `publishDate` when present — low-cost, include if available). Existing `og:title` / `og:description` / `og:url` / `twitter:card` retained.

## Fonts

`satori` cannot read the WOFF2 *variable* files `@fontsource` ships, so commit **static font files** (TTF/OTF):

- Newsreader 600 (normal) — title.
- Newsreader italic — dek.
- Inter for the bar text — exact weights finalized in the plan against real renders (expected ~Inter 600 for the name, a regular/lighter weight for the URL at reduced opacity). Only the weights the card actually renders get committed.

- **Location:** `src/assets/og-fonts/` — read by the build via `fs`, **not served**.
- Sourced from Google Fonts, **version-pinned**, latin-subset to keep them small.

## Files

- **New:**
  - `src/lib/og.ts` — dimensions, route→content map, path helper, tier logic.
  - `src/pages/og/[...route].png.ts` — static endpoint: `getStaticPaths()` + `GET` → satori → resvg → PNG `Response`.
  - `src/assets/og-fonts/*.ttf` — committed static fonts.
  - (card-layout rendering may live in `og.ts` or a sibling module — implementation detail for the plan.)
- **Modified:**
  - `src/layouts/BaseLayout.astro` — derive/accept `ogImage`, emit the image meta tags.
  - `src/layouts/ArticleLayout.astro` — `og:type=article`, pass note card path through.
  - `index.astro` / `notes/index.astro` / `zork.astro` — only if explicit per-page content is needed; expected to be unnecessary given pathname auto-derivation.
  - `package.json` — add `satori` and `@resvg/resvg-js` as pinned **devDependencies**.

## Verification (`scripts/verify-site.mjs` additions)

1. Every HTML page emits `og:image` + `og:image:width/height/type/alt` + `twitter:image`, all **absolute https** URLs.
2. Every referenced card PNG exists in `dist/` and is a valid **1200×630** PNG (parse the PNG IHDR for dimensions).
3. Cards exist for: home, `/notes`, **every** note, `/zork`.
4. **Per-note length guard:** a note's title/dek must fit the smallest type tier — warn/fail at build so overflow is caught before deploy, never in the wild.
5. The existing **no-job-signal denylist** also runs over card text (defense in depth).

**Gates (unchanged):** `npm run check` (astro check) + `npm run verify` (build + verify-site) before any merge to `main`. Execution is subagent-driven. Explicit "go" from Dylan before anything touches `main`.

## Constraints honored

- Zero client JS — build-time only; no on-page asset → Lighthouse unaffected.
- No active-job-search signals — denylist runs over card text.
- Sanitized content — card text = already-vetted titles/deks; industry tool names are fine, real names/data/metrics are not.
- Editorial Calm palette and type throughout.

## Out of scope (noted, not now)

- Removing location from site copy (separate quick pass — offered).
- PDF edition of the white paper; dark mode; GitHub elevation.
- Per-card custom artwork — cards are text-only by design.

## Deferred to the implementation plan

- Exact type-tier thresholds and bar-height ratio — tuned during implementation against real renders.
- Final `og:image:alt` wording (= headline).
- `/notes` headline confirmed as "Notes".
- Whether to include `article:published_time` (include when `publishDate` is present).
