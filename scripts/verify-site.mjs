import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const html = readFileSync(join(DIST, "index.html"), "utf8");
// `text` = visible text only (tags stripped) — used to scan for job-search signals.
const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").toLowerCase();
// `raw` = full HTML incl. href attributes — used to confirm required links/content
// are present even when they sit behind friendly labels (e.g. "Email" → mailto:).
const raw = html.toLowerCase();

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
  if (!raw.includes(needle.toLowerCase())) errors.push(`MISSING required content: "${needle}"`);
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
