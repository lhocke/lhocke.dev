# Design — athena white paper + Notes section (lhocke.dev)

**Date:** 2026-06-15
**Status:** Design approved in brainstorming; spec pending user review → writing-plans.
**Supersedes/extends:** `2026-06-14-portfolio-revamp-design.md` §7 (athena project card), §10–11 (writing section deferred to Phase 2).

## 1. Goal

Make the **athena** project (project card #3 — "Investigation & Eval Pipeline") *demonstrable* rather than merely asserted, without exposing the private/unsanitized repo. The vehicle is a **white paper**: a sanitized, long-form technical essay that shows the system's architecture, a representative workflow, and the evaluation rigor behind it — proving capability and thought process while leaking nothing confidential.

Because athena's repo is private and unsanitized, a live demo (the Zork playbook) is the wrong form. A white paper is the credible sanitized form: it shows the *thinking*, the *architecture*, and *representative (synthetic) workflows* — and it doubles as a generous, reusable artifact ("this helps me; maybe it helps you").

This unit also **launches the site's "Notes" section** (the long-deferred writing section), scoped tight to this one piece but built as reusable infrastructure. It gives future writing — and the dormant Zork `SHOW_SOURCE` dev-story link — a home.

## 2. Hard Constraints (inherited + sharpened)

From the portfolio spec §2, all still binding:

- **No active-job-search signals.** Nothing that announces availability or intent.
- **Qualitative impact only.** No real metrics, baselines, or improvement percentages anywhere in the paper.
- **Sanitize work-confidential material.** Describe capability, not internal specifics.
- **Honesty.** No fabrication of *capability*; the synthetic example must be labeled synthetic.

**Sharpened for this paper (the sanitization line):**

- **Tool/source names ARE safe to name** — BigQuery, Datadog, Slack, Notion, Jira, Zendesk are industry-standard products; naming them leaks nothing and *reinforces* generality (every kind of company runs that stack).
- **NOT safe, must stay synthetic/absent:** real client or employer names, real data/records, real case details, internal system/service names, real workflows, and any real numbers (volumes, accuracy, latency, cost). Every concrete value in the worked example is fabricated and explicitly labeled illustrative.
- **Generalization is a goal, not just a constraint.** The paper deliberately frames the work as a domain-agnostic *pattern* so it demonstrates transferable skill and thought process — not finance-specific expertise. The worked example is concrete (real tool names, a synthetic case) but domain-neutral.
- **Reads as human, in Dylan's voice — never AI slop (non-negotiable).** The copy *is* the product here; AI-generated tells are a defect, not a stylistic quibble — they directly undercut the "real builder who measures his work" thesis. Dylan edits final copy, but drafts must land in-voice enough that editing is light, not a rescue. Full discipline + authoring process in §5.5.

## 3. Decisions (converged in brainstorming)

| Fork | Decision |
|---|---|
| Structural home | **Launch a "Notes" section**, scoped tight; athena white paper is the first entry. Reusable content-collection infrastructure. |
| Section label | **"Notes"** — echoes the site's own contact voice ("trade notes on AI tooling"); senior, understated, no cadence promise. (Rejected: Blog = too casual + implies cadence; Writing = clunky; Essays = runner-up.) |
| Depth | **Layered** — skimmable spine (clear headers, per-section takeaways, diagrams that carry the gist) over genuine technical depth in the prose. Serves both the skimming hiring manager and the engineer who reads every word. |
| Narrative spine | **Two-act** — Act I "the system" (build the thing), Act II "proving it works" (the eval rigor). Mirrors the site tagline. Co-equal pillars. |
| Worked example | **Domain-general** to show skills generalize; **real source tool names**, fully **synthetic data/case**. |
| Diagram style | **Editorial line** (hairline SVG, serif labels, teal connectors) — zero-JS, matches the site. Schematic/blueprint variant reserved for the densest Act II diagram (eval harness) if it earns its keep. |
| Page layout | **Sticky "on this page" TOC** + reading column + white-paper masthead. **Pure CSS, zero JS** (static anchors; no live scroll-spy highlight, to protect Lighthouse). Collapses to an inline list at top on mobile. |
| PDF | **Architect-don't-preclude.** Single MDX source so a future PDF derives from the same content; PDF generation deferred to its own unit. A tasteful in-voice "PDF edition coming" note may signal intent (house style). |
| Authoring format | **MDX** content collection — markdown prose + embedded Astro components (diagrams, callouts), so one source feeds web (and later PDF). |
| Copy voice | **Human, in Dylan's voice — anti-slop is a hard acceptance criterion.** Voice-calibration loop + banned-tell discipline + Dylan owns final copy (§5.5). |

## 4. Architecture & File Structure

**Integration:**
- Add **`@astrojs/mdx`** to `astro.config.mjs` (first-party, standard for MDX content).

**Content collection** (`src/content.config.ts`):
- New `notes` collection via the glob loader: `src/content/notes/**/*.mdx`.
- Schema: `title` (string), `dek` (string — the italic kicker), `abstract` (string — TL;DR for the abstract box + meta description), `tags` (string[] — the source tools), `publishDate` (date, optional), `order` (number), `draft` (boolean, default false).
- The first entry: `src/content/notes/athena-investigation-pipeline.mdx`.

**Routes:**
- `src/pages/notes/index.astro` — the Notes section index (lists articles; today just the one).
- `src/pages/notes/[...slug].astro` — renders an article from the `notes` collection → `/notes/athena-investigation-pipeline`.

**Layout:**
- New `src/layouts/ArticleLayout.astro`, built on the existing `BaseLayout.astro`. Provides: back-link, masthead (title / dek / abstract box / source-tag pills), the sticky-TOC rail, the reading column, and the footer. Receives `headings` (from the collection entry's `render()`) to build the TOC.

**Components** (new, under `src/components/notes/`):
- `Takeaway.astro` — the teal per-section takeaway callout.
- `SourceTags.astro` — the source-tool pills (driven by frontmatter `tags`).
- `OnThisPage.astro` — the sticky TOC (static anchors from `headings`, `position:sticky`, zero JS).
- `Abstract.astro` — the masthead abstract box (or rendered inline by `ArticleLayout`).
- Diagram components as inline-SVG `.astro` files (one per diagram — see §6), so each diagram is a version-controlled, reusable asset importable in MDX and a future PDF.

**Homepage wiring:**
- `src/content/projects/3-athena.md` — add `href: /notes/athena-investigation-pipeline` and `linkLabel: "Read the white paper"` (exact Zork-card playbook; the card currently has no `href`).

**Navigation:**
- Add a quiet **"Notes"** link to `src/components/Nav.astro` (the section now exists).

## 5. Content Outline — the white paper

**Working title:** *"Build the thing, then prove it works: a multi-source investigation pipeline"* (ties to the site tagline). Alt: *"Correlating evidence across six systems — and proving the AI did it right."* Title is refinable during authoring.

**Masthead:** title · dek · abstract box (2–3 sentence TL;DR, also meta description) · source-tag pills (BigQuery · Datadog · Slack · Notion · Jira · Zendesk).

**Act I — The system** *(build the thing)*
1. **The problem** — when the answer lives scattered across many systems, investigation is slow, manual, and humans miss cross-source connections. Framed domain-generally.
2. **Architecture** — specialized agents (one per source, each fluent in its system's query model) → correlation → **validation (self-check)** → redaction → structured output. → *canonical pipeline diagram* (with the validation feedback loop).
3. **Why specialized agents** — design judgment: focused context, source-specific query idioms, isolation, testability — vs. a single do-everything prompt.
4. **PII redaction as a first-class stage** — structural, not bolt-on: safe to log, safe to send to cloud models, compliance-aligned. → *before/after panel* on synthetic text.
5. **The structured-output contract** — emits a typed, validated object, not prose. → sanitized *JSON schema/example*. Why: composability, verifiability, and it's what makes the system *evaluable*.
6. **A representative workflow** — one synthetic investigation walked end-to-end: agents gather across the named sources → correlation drafts a finding → **the self-validation loop catches an unsupported/contradicted claim, re-queries, and gathers more** → only a validated, confidence-scored finding is emitted (with provenance). → *sequence diagram*. *(Takeaway callout.)*

**Act II — Proving it works** *(prove it)*
7. **Why evaluate at all** — the skeptic's stance: *"skeptical of AI hype, which is exactly why I measure what I build."*
8. **Blind, multi-fixture evaluation** — fixtures with known-good answers, blind grading, scored across models. → *eval-harness diagram* (schematic/blueprint variant candidate).
9. **Right-sizing local vs. cloud** — the decision framework: which tasks a small local model handles vs. need a frontier model; cost/latency/privacy tradeoffs the evals drive. → *results table* (synthetic numbers, labeled illustrative).
10. **What the rigor buys** — confidence to ship, safe model swaps, cost control, regression detection. *(Takeaway callout.)*

**Coda — Generalizing it** — the pattern (specialized agents + correlation + self-validation + structured output + blind evals + right-sizing) transfers to any multi-source reasoning problem. *"This helps me; maybe it helps you."* Optional in-voice "PDF edition coming" note.

**Two confidence layers (the bridge):** runtime self-validation (Act I §6) + offline blind-fixture evaluation (Act II) = defense in depth on correctness. This linkage is the spine of the rigor story.

**Scope target:** ~1,500–2,500 words.

## 5.5 Voice & Anti-Slop Discipline (non-negotiable)

The paper's credibility rests on it reading as written by a sharp, skeptical engineer — *Dylan* — not generated. AI-slop tells are a defect that undercuts the whole "real builder who measures his work" thesis. Grounded in the live site copy (Hero/About) and the communication log; refined by audit dimension 4 (tone/communication).

**Voice anchors** (from the live site and how Dylan actually writes):
- First person, plainspoken, concrete — names the specific tool and the specific tradeoff instead of abstractions.
- Dry, a little irreverent; confident without grandiosity. Short punchy contrasts land — cf. the site's *"The title says support; the habit says builder."*
- Genuinely skeptical of AI hype — *"which is exactly why I measure what I build."* Takes a position; doesn't both-sides everything.
- Rhythm varies — short declaratives next to longer sentences. Not every paragraph the same length or shape.

**Banned LLM tells** (non-exhaustive; presence = defect):
- *Vocabulary:* delve, leverage, robust, seamless, tapestry, testament, realm, "navigate the complexities," unlock, elevate, game-changer, "deep dive," "in today's…," "fast-paced."
- *Connective filler:* "it's worth noting," "furthermore," "moreover," "that said" (as a tic), "in conclusion," "at the end of the day."
- *Structural tics:* the "not just X, but Y" construction on repeat; rule-of-three everywhere; uniformly parallel bullets; hedging every claim; throat-clearing intros and summary-restating conclusions; mechanical signposting ("First… Second… Finally…").
- *Tone:* breathless enthusiasm, exclamation points, marketing gloss, over-explaining the obvious.

**Structural anti-slop:** lead with substance, not a windup. Let sections be uneven in length. Allow a dry aside or a sharp opinion. Prefer one concrete example to three generic claims. Cut any sentence that isn't carrying weight.

**Authoring process — how we actually hit the voice, not just hope for it:**
1. **Voice-calibration loop FIRST.** Before drafting the whole paper, draft *one* representative, judgment-heavy section (proposed: "Why specialized agents"). Dylan edits it heavily. The diff is studied, the concrete voice deltas extracted, and applied to every subsequent section. Front-loads calibration so the bulk draft lands close.
2. **Substance originates with Dylan where possible.** Per section, Dylan can drop raw bullet thoughts / real phrasing to shape — rather than claims and tone invented whole-cloth. The thinking is his; the job is structure and flow.
3. **Drafts are explicitly "raw for heavy edit,"** never presented as final. Dylan owns final copy.
4. **Read the live site copy as the voice reference** before each drafting pass.
5. **Dedicated anti-slop review pass** before any merge: an independent reviewer (and Dylan) reads specifically for AI tells against this list — separate from the correctness/sanitization review.

**Verification:** extend `verify-site.mjs` with a **banned-tell grep** over built `/notes/*` output, flagging the vocabulary/filler list above. Deterministic; complements the leak denylist (§7). It can't judge "slop" holistically — that's the review pass + Dylan's edit — but it catches the obvious tells mechanically.

## 6. Diagram Inventory

Editorial-line SVG (`.astro` components) unless noted — items 2 and 3 are intentional exceptions (HTML/code panels). All zero-JS, on the site palette (paper `#fafaf9` · ink `#1c1917` · accent teal `#0f766e`):

1. **Pipeline architecture** (canonical) — sources → specialized agents → correlate → **validate (with feedback loop)** → redact → structured output. *Act I §2.*
2. **Redaction before/after** — synthetic text panel, raw vs. redacted. *Act I §4.* (Styled HTML/code panel acceptable here.)
3. **Structured-output schema/example** — sanitized JSON. *Act I §5.* (Code block, not SVG.)
4. **Representative-workflow sequence** — the end-to-end synthetic case including the self-validation loop. *Act I §6.*
5. **Eval harness** — fixtures → blind grade → score across models. *Act II §8.* (Schematic/blueprint variant candidate.)
6. **Right-sizing results table** — synthetic numbers, models × tasks, local vs. cloud. *Act II §9.*

## 7. Sanitization & Verification

- **Synthetic-data discipline:** every concrete entity, record, and number in the worked example and diagrams is fabricated and explicitly labeled illustrative. Only tool names are real.
- **`verify-site.mjs` guardrail (new):** extend the existing verifier to fail the build if any term from a **denylist of real names** (employer/client names, internal system/service names) appears in the built `/notes/*` output. This is a deterministic substring check — *not* a "real-looking number" detector, which would false-positive on the legitimate synthetic results table. Numbers stay safe via the synthetic-data discipline + explicit illustrative labels, confirmed by review. The guard is belt-and-suspenders on the discipline (a backstop, not the primary mechanism — the discipline is the author's).
- **Banned-tell grep (new, see §5.5):** the verifier also flags AI-slop vocabulary/filler in built `/notes/*` output. Mechanical backstop on the voice discipline; the holistic judgment stays with the anti-slop review pass + Dylan's edit.
- **Existing gates still apply:** `npm run check` + `npm run verify` (build + verifier) must be green before any merge. The verifier should also assert the new route renders and the athena card links to it (mirrors the /zork verifier extension).
- **Accessibility:** dark-on-light is the default, but every new text/background pair (callouts, TOC, tags, diagram labels) gets a WCAG AA contrast check — the Phase-2 Zork work twice shipped sub-AA faint text; do not repeat. Diagrams carry text alternatives (`<title>`/`aria-label`).

## 8. Out of Scope (this unit)

- **PDF generation** — deferred to its own unit (single MDX source preserves the option). Only a possible in-voice "coming" note ships now.
- **Live scroll-spy TOC highlight** — needs JS; deferred to protect zero-JS Lighthouse posture. Static anchors only.
- **Schematic/blueprint diagram variant** — used only if the eval-harness diagram clearly benefits; otherwise all diagrams are Editorial-line.
- **Additional Notes articles** (incl. the Zork dev-story that would unlock `SHOW_SOURCE`) — the infrastructure supports them, but only the athena paper ships here.
- **Dark mode, OG image** — separate backlog items.

## 9. Open / Deferred

- Final title selection (during authoring).
- Whether the in-voice "PDF edition coming" note ships now or waits for the PDF unit.
- Exact denylist contents for the `verify-site.mjs` leak-pattern guard (assemble during implementation; keep the denylist itself out of git history if it contains the real names — or encode as hashes/an env-supplied list so the spec/verifier don't themselves leak).

## 10. Execution Notes

- Deploy = push to `main` (Cloudflare git-connected). Gates before any content change: `npm run check` + `npm run verify`.
- Subagent-driven execution; **explicit "go" from the user before any build step** and before touching `main` (deploy-linked repo).
