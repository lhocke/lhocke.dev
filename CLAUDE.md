# CLAUDE.md — lhocke.dev (Dylan Ishihara's portfolio)

Astro 6 + Tailwind v4 (design tokens via `@theme` in `src/styles/global.css`; no `tailwind.config`). Design system: **"Editorial Calm"** — warm-neutral paper/ink, a single restrained teal accent (`#0f766e`), Newsreader serif + Inter. Astro ships zero JS by default; **keep it that way** — near-perfect Lighthouse is itself a credibility signal.

**Deploy = push to `main`** (Cloudflare Pages, git-connected — every push to `main` deploys). Keep work on a feature branch; get an **explicit "go" from Dylan before anything touches `main`** and before build steps. Prefer subagent-driven execution. Gates before any merge that could deploy: `npm run check` (astro check) **and** `npm run verify` (build + `scripts/verify-site.mjs`).

## Hard constraints (non-negotiable)

- **No active-job-search signals.** Dylan is employed and searching discreetly. No "open to work," availability badges, "looking for my next role," etc. (`verify-site.mjs` enforces a denylist.)
- **Qualitative impact only** in copy — no real metrics, baselines, or percentages about work. Use "substantial," "significant."
- **Sanitize work-confidential material** — describe capability, not internal specifics. Industry-standard tool names (BigQuery, Datadog, Slack, Notion, Jira, Zendesk, etc.) are fine to name; real client/employer/internal-system names, real data, and real numbers are not.

## Voice & content writing (applies to ALL site prose — Notes articles, project copy, page text)

Any prose written for this site must read as **human, written by Dylan — never AI slop.** This is a hard acceptance criterion, not a stylistic nicety: AI tells directly undercut the site's whole "real builder who measures his work" thesis.

- **Voice ground truth is Dylan's own writing + his edits — NOT the existing site copy.** The current Hero/About/Projects copy was largely *Claude-drafted and accepted*, not authored by Dylan; calibrating new prose to it is circular (it reproduces Claude's approximation of his voice). Use authentic samples Dylan wrote, plus his edits in a **calibration loop**: draft one section → Dylan edits it hard → extract the concrete voice deltas → apply to the rest.
- **Voice is audience-dependent — Dylan code-switches** (English-major background, wide reading). There is no single "Dylan voice"; target the **register** for the specific audience/genre.
- **Register for technical writing** (white papers / Notes; audience = hiring managers, engineers, support leaders) — *a senior engineer explaining a system they built and were skeptical enough to measure.* Anchors, calibrated from his own writing:
  - **Conviction-first openers** — a flat first-person stance, then the justification ("I don't like waste"; "I don't trust one-time outputs").
  - **Accretive, cumulative cadence** — long sentences that build reasoning clause by clause; **not** chopped into staccato. Fix grammar (comma splices, run-ons) in editing, but preserve the additive way he thinks on the page.
  - **Plain, precise, deflating diction** — everyday analogies, and *concrete beats tidy* (he edited "the right tool" → "a screwdriver" — reach for the specific mundane object). Un-awed framings of LLMs ("just seek positive responses to their outputs"); deliberately precise terms over hype ("computational models," not "AI").
  - **Anti-waste worldview, surfaced explicitly** — the real driver. He doesn't just hold it in the background; he names the cost/efficiency consequence of a technical choice out loud ("valuable time," "it's cheaper to rerun a failed step," "doesn't require rolling an agent from scratch"). Right-size because wasting compute/money/time on tools that don't earn their keep is the actual objection.
  - **Cross-link the threads** — ideas reference each other across sections (he wove self-validation into the specialized-agents argument). Don't write siloed sections.
  - **Skeptical, not cynical.** Core thesis, surfaced as **a couple of sharp lines at most — never a manifesto:** computational models (and ML broadly) have real benefit, but the current hype reads as a marketing-driven cash grab in search of a purpose. (He doesn't hide this view, but most venues aren't the place for the full case.) **Aim the edge at the hype/marketing, never at other practitioners** — cut cheap shots (he removed "and most people never measure it").
  - **Frame sanitized/synthetic choices positively** — "for the sake of generalization," not defensively ("so nothing leaks"). The synthetic worked example reads as *deliberately portable*, not as *hiding something*.
  - **The team / tacit-knowledge dimension is part of how he sees value** — tools like this capture institutional knowledge that takes months to transfer to a new hire and never fully does, not just one person's saved time. (He added this unprompted; it's a real lens.)
  - **Minimal visible enumeration** in body prose — no "first / second / finally" scaffolding; enumerated direct answers belong only in an optional FAQ.
- **Banned LLM tells** (a defect if present): *vocab* — delve, leverage, robust, seamless, tapestry, testament, realm, "navigate the complexities," unlock, elevate, game-changer, "deep dive," "in today's…"; *filler* — "it's worth noting," "furthermore," "moreover," "that said" (as a tic), "in conclusion," "at the end of the day"; *structure* — rule-of-three tics, uniformly parallel bullets, hedging every claim, throat-clearing intros and summary-restating conclusions, mechanical signposting; *tone* — breathless enthusiasm, exclamation points, marketing gloss, over-explaining the obvious.
- **Process:** Dylan owns final copy. Draft "raw for heavy edit," never presented as final. Run a **dedicated anti-slop review pass** before merge (separate from correctness/sanitization). `verify-site.mjs` carries a banned-tell grep as a mechanical backstop — it catches obvious tells but cannot judge "slop" holistically; that stays with the review pass + Dylan's edit.

---

Per-unit design specs live in `docs/superpowers/specs/`; implementation plans in `docs/superpowers/plans/`.
