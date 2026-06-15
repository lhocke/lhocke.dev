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
