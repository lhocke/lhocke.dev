// src/lib/og.ts
// Pure helpers and content map for OG image generation.
// Pure functions (ogImagePath, pickTier, barLeft) do NOT import astro:content
// so node:test can import this module without the Astro runtime.
// Only allCards() touches astro:content — it is imported lazily inside the function.

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// ---------------------------------------------------------------------------
// Content map for static pages (non-note routes)
// ---------------------------------------------------------------------------

export interface CardContent {
  title: string;
  dek: string;
  showName: boolean; // false = bar-left is empty (homepage only)
}

export const STATIC_CARDS: Record<string, CardContent> = {
  home: {
    title: 'Dylan Ishihara',
    dek: 'Developer-turned-support-leader who never stopped building.',
    showName: false,
  },
  notes: {
    title: 'Notes',
    dek: 'Occasional long-form on building and evaluating AI tooling, and the craft of software.',
    showName: true,
  },
  zork: {
    title: 'Zork, ZIL → TypeScript',
    dek: 'Porting a 1977 mainframe game to the modern web.',
    showName: true,
  },
};

// ---------------------------------------------------------------------------
// Pure helpers — importable by node:test without the Astro runtime
// ---------------------------------------------------------------------------

/**
 * Maps a page pathname to its og:image path (relative URL, no hostname).
 * Robust to trailing slashes.
 *
 * Mapping:
 *   /                           → /og/home.png
 *   /notes  or  /notes/         → /og/notes.png
 *   /zork   or  /zork/          → /og/zork.png
 *   /notes/<slug>  or trailing/ → /og/notes/<slug>.png
 *   anything else               → /og/home.png  (fallback)
 */
export function ogImagePath(pathname: string): string {
  // Normalize: strip trailing slash, ensure leading slash
  const p = '/' + pathname.replace(/^\//, '').replace(/\/$/, '');

  if (p === '/') return '/og/home.png';
  if (p === '/notes') return '/og/notes.png';
  if (p === '/zork') return '/og/zork.png';

  const noteMatch = p.match(/^\/notes\/([^/]+)$/);
  if (noteMatch) return `/og/notes/${noteMatch[1]}.png`;

  // Fallback to home card
  return '/og/home.png';
}

// ---------------------------------------------------------------------------
// Type tier — controls title font size based on character count
// ---------------------------------------------------------------------------

export interface TierConfig {
  titleSize: number; // px
  dekSize: number;   // px
}

/**
 * Picks a type tier based on title character count.
 * ≤38 chars → large (80px title)
 * 39–62 chars → medium (64px title)
 * >62 chars → small (52px title)
 * Dek is always 30px (wraps to 2 lines max).
 */
export function pickTier(title: string): TierConfig {
  const len = title.length;
  if (len <= 38) return { titleSize: 80, dekSize: 30 };
  if (len <= 62) return { titleSize: 64, dekSize: 30 };
  return { titleSize: 52, dekSize: 30 };
}

// ---------------------------------------------------------------------------
// Bar-left rule
// ---------------------------------------------------------------------------

/**
 * Returns the bar-left text.
 * showName=false (homepage): empty — headline IS the name; doubling removed.
 * showName=true: "Dylan Ishihara"
 */
export function barLeft({ showName }: { showName: boolean }): string {
  return showName ? 'Dylan Ishihara' : '';
}

// ---------------------------------------------------------------------------
// allCards() — enumerates all cards for getStaticPaths
// Imports astro:content; NOT safe to call from node:test.
// ---------------------------------------------------------------------------

export interface SlugCard {
  slug: string;        // e.g. 'home' | 'notes' | 'zork' | 'notes/athena-investigation-pipeline'
  content: CardContent;
}

/**
 * Returns all card descriptors: static pages + one per note.
 * Called only from the Astro endpoint (astro:content is available).
 */
export async function allCards(): Promise<SlugCard[]> {
  // Dynamic import keeps astro:content out of the module's top-level parse,
  // so node:test can still import the pure exports above.
  const { getCollection } = await import('astro:content');
  const notes = await getCollection('notes'); // include drafts so card exists for every route

  const staticEntries: SlugCard[] = Object.entries(STATIC_CARDS).map(([key, content]) => ({
    slug: key,
    content,
  }));

  const noteEntries: SlugCard[] = notes.map((note) => ({
    slug: `notes/${note.id}`,
    content: {
      title: note.data.title,
      dek: note.data.dek,
      showName: true,
    },
  }));

  return [...staticEntries, ...noteEntries];
}
