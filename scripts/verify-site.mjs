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
const notesIndex = load("notes/index.html");
const athenaPaper = load("notes/athena-investigation-pipeline/index.html");

if (!index) errors.push("MISSING page: dist/index.html");
if (!zork) errors.push("MISSING page: dist/zork/index.html (the /zork route)");

// Site-wide corpora — robust to which page hosts which content.
const pages = [index, zork, notesIndex, athenaPaper].filter(Boolean);
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

// The /notes index must offer a way home (nav brand links to "/"); regression guard.
if (notesIndex && !notesIndex.raw.includes('href="/"')) {
  errors.push('/notes: MISSING a link home (href="/") — nav must work off the homepage');
}

// --- No leftover stub content shipped ---
// Match the ALL-CAPS stub sentinel only, on the original-case HTML — lowercase
// "placeholder" is legitimate prose (the redaction section discusses stable placeholders).
if (process.env.NOTES_READY === "1") {
  for (const rel of ["notes/index.html", "notes/athena-investigation-pipeline/index.html"]) {
    const full = join(DIST, rel);
    if (!existsSync(full)) continue;
    if (/\bPLACEHOLDER\b/.test(readFileSync(full, "utf8"))) {
      errors.push(`Stub PLACEHOLDER text present in ${rel} — author real content before shipping`);
    }
  }
}

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

// ─── OG Image checks ────────────────────────────────────────────────────────

// Helper: parse a meta property/name content value from raw HTML.
// Returns the content string or null if the tag is not found.
function metaContent(html, property) {
  // Matches both property="og:..." and name="twitter:..." variants
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']|` +
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    'i'
  );
  const m = html.match(re);
  return m ? (m[1] ?? m[2]) : null;
}

// 7. Every HTML page must have og:image + og:image:width/height/type/alt + twitter:image,
//    all as absolute https URLs.
const OG_PAGES = [
  { label: 'index', page: index },
  { label: 'zork', page: zork },
  { label: 'notes/index', page: notesIndex },
  { label: 'notes/athena', page: athenaPaper },
];

for (const { label, page } of OG_PAGES) {
  if (!page) continue; // already reported as missing above

  const ogImage = metaContent(page.raw, 'og:image');
  if (!ogImage) {
    errors.push(`OG: ${label} missing og:image meta tag`);
  } else if (!ogImage.startsWith('https://')) {
    errors.push(`OG: ${label} og:image is not an absolute https URL: "${ogImage}"`);
  }

  const ogWidth = metaContent(page.raw, 'og:image:width');
  if (ogWidth !== '1200') errors.push(`OG: ${label} og:image:width expected "1200", got "${ogWidth}"`);

  const ogHeight = metaContent(page.raw, 'og:image:height');
  if (ogHeight !== '630') errors.push(`OG: ${label} og:image:height expected "630", got "${ogHeight}"`);

  const ogType = metaContent(page.raw, 'og:image:type');
  if (ogType !== 'image/png') errors.push(`OG: ${label} og:image:type expected "image/png", got "${ogType}"`);

  const ogAlt = metaContent(page.raw, 'og:image:alt');
  if (!ogAlt) errors.push(`OG: ${label} missing og:image:alt`);

  const twImage = metaContent(page.raw, 'twitter:image');
  if (!twImage) {
    errors.push(`OG: ${label} missing twitter:image meta tag`);
  } else if (!twImage.startsWith('https://')) {
    errors.push(`OG: ${label} twitter:image is not an absolute https URL: "${twImage}"`);
  }
}

// 8. Every referenced og:image URL must have a matching PNG in dist/,
//    and that PNG must be a valid 1200×630 image (verified via IHDR).
//
// PNG IHDR structure:
//   Bytes 0–7:   PNG signature
//   Bytes 8–11:  chunk length (4 bytes)
//   Bytes 12–15: chunk type "IHDR"
//   Bytes 16–19: width (uint32 big-endian)
//   Bytes 20–23: height (uint32 big-endian)

function parsePngDimensions(filePath) {
  // Read the file and inspect the first 24 bytes (PNG signature + IHDR).
  // readFileSync is already imported at the top of verify-site.mjs.
  const buf = readFileSync(filePath).subarray(0, 24);
  // Verify PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    return null; // not a PNG
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

// Cards that must exist (static pages + known notes)
const REQUIRED_CARDS = [
  'dist/og/home.png',
  'dist/og/notes.png',
  'dist/og/zork.png',
  'dist/og/notes/athena-investigation-pipeline.png',
];

for (const cardPath of REQUIRED_CARDS) {
  const fullPath = join(DIST, cardPath.replace('dist/', ''));
  if (!existsSync(fullPath)) {
    errors.push(`OG-PNG: MISSING required card: ${cardPath}`);
    continue;
  }
  const dims = parsePngDimensions(fullPath);
  if (!dims) {
    errors.push(`OG-PNG: ${cardPath} is not a valid PNG`);
  } else if (dims.width !== 1200 || dims.height !== 630) {
    errors.push(`OG-PNG: ${cardPath} has wrong dimensions: ${dims.width}×${dims.height} (expected 1200×630)`);
  }
}

// Also verify that every og:image URL referenced in HTML has a file in dist/.
// Catches drift between what BaseLayout emits and what the endpoint produces.
for (const { label, page } of OG_PAGES) {
  if (!page) continue;
  const ogImage = metaContent(page.raw, 'og:image');
  if (!ogImage || !ogImage.startsWith('https://')) continue; // already reported above
  try {
    const url = new URL(ogImage);
    const distFile = join(DIST, url.pathname);
    if (!existsSync(distFile)) {
      errors.push(`OG-PNG: ${label} references og:image "${url.pathname}" but no such file in dist/`);
    }
  } catch {
    errors.push(`OG-PNG: ${label} og:image is not a parseable URL: "${ogImage}"`);
  }
}

// 9. Per-note length guard: a note's title must fit the smallest type tier.
//    The smallest tier (52px) handles titles up to ~80 chars before wrapping
//    badly. Titles > 80 chars are flagged — they'd need a custom override or
//    a new tier. Dek is always 30px and wraps to 2 lines; warn if dek > 120 chars.
//
// This check runs at build time (post-build on dist HTML) by reading the
// og:image:alt meta, which carries the raw note title.
// We also guard the known note directly.

const athenaAlt = athenaPaper ? metaContent(athenaPaper.raw, 'og:image:alt') : null;
if (athenaAlt && athenaAlt.length > 80) {
  errors.push(
    `OG-LENGTH: athena note title is ${athenaAlt.length} chars (> 80) — ` +
    `will overflow the smallest type tier. Shorten or add a new tier.`
  );
}

// Note: verify-site runs post-build on the dist HTML and hardcodes known
// note pages (same pattern as `athenaPaper` above). For a note, og:image:alt
// carries the bare card title (ArticleLayout passes ogImageAlt={title}), so
// the length check above is valid. When a new note is added, add an
// athena-style alt-length check for it here. The endpoint also fails the
// build directly if satori cannot render a card, so genuine overflow surfaces
// at build time regardless.

// 10. Defense in depth: no job-search signals in og:image:alt (= card headline).
for (const { label, page } of OG_PAGES) {
  if (!page) continue;
  const alt = metaContent(page.raw, 'og:image:alt') ?? '';
  for (const phrase of FORBIDDEN) {
    if (alt.toLowerCase().includes(phrase)) {
      errors.push(`OG-SIGNAL: ${label} og:image:alt contains job-search signal: "${phrase}"`);
    }
  }
}

if (errors.length) {
  console.error("❌ verify-site failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("✅ verify-site passed: both routes, no job-search signals, all required content present.");
