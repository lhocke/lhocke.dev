// src/pages/og/[...slug].png.ts
// Build-time static endpoint: renders one PNG per page via satori + resvg.
// Output: dist/og/home.png, dist/og/notes.png, dist/og/zork.png,
//         dist/og/notes/<noteSlug>.png
// Zero client JS — runs only during astro build.

import type { APIRoute, GetStaticPaths } from 'astro';
import type { Font as SatoriFont } from 'satori';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { OG_WIDTH, OG_HEIGHT, allCards, pickTier, barLeft } from '../../lib/og.ts';

export const prerender = true;

// ---------------------------------------------------------------------------
// Font loading — resolved from project root (process.cwd()) so the path
// survives Astro bundling the endpoint into dist/.prerender/chunks/.
// ---------------------------------------------------------------------------

const fontsDir = join(process.cwd(), 'src/assets/og-fonts');

const newsreader600 = readFileSync(join(fontsDir, 'newsreader-600.ttf'));
const newsreaderItalic = readFileSync(join(fontsDir, 'newsreader-italic.ttf'));
const inter600 = readFileSync(join(fontsDir, 'inter-600.ttf'));
const inter400 = readFileSync(join(fontsDir, 'inter-400.ttf'));

const FONTS: SatoriFont[] = [
  { name: 'Newsreader', data: newsreader600,    weight: 600, style: 'normal' },
  { name: 'Newsreader', data: newsreaderItalic, weight: 600, style: 'italic' },
  { name: 'Inter',      data: inter600,          weight: 600, style: 'normal' },
  { name: 'Inter',      data: inter400,          weight: 400, style: 'normal' },
];

// ---------------------------------------------------------------------------
// getStaticPaths — enumerates every card slug
// ---------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  const cards = await allCards();
  return cards.map(({ slug, content }) => ({
    params: { slug },
    props: content,
  }));
};

// ---------------------------------------------------------------------------
// Card layout builder — plain object tree (no JSX, no extra deps)
// ---------------------------------------------------------------------------

/**
 * Builds the satori element tree for the footer-bar card layout.
 *
 * Layout (1200×630, position:relative):
 *   ┌─────────────────────────────────────────────┐
 *   │  padding: 84px                              │
 *   │  title (Newsreader 600, ink)                │
 *   │  dek   (Newsreader italic, teal)            │
 *   ├─────────────────────────────────────────────┤
 *   │  teal bar 120px — name left / lhocke.dev rt │
 *   └─────────────────────────────────────────────┘
 *
 * satori supports flexbox only (no CSS grid).
 * The title region uses minHeight:0 so content can never push the bar off-card.
 * The bar uses flexShrink:0 and is absolutely positioned at the bottom.
 */
function buildCardElement(title: string, dek: string, name: string) {
  const { titleSize, dekSize } = pickTier(title);

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: `${OG_WIDTH}px`,
        height: `${OG_HEIGHT}px`,
        backgroundColor: '#fafaf9',
        position: 'relative',
        overflow: 'hidden',
      },
      children: [
        // Content region (title + dek) — fills space above bar
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: '1',
              minHeight: '0',
              justifyContent: 'center',
              padding: '84px',
              paddingBottom: '40px', // extra breathing room above bar
            },
            children: [
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Newsreader',
                    fontWeight: 600,
                    fontSize: `${titleSize}px`,
                    color: '#1c1917',
                    lineHeight: 1.07,
                    letterSpacing: '-0.02em',
                  },
                  children: title,
                },
              },
              // Dek
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Newsreader',
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: `${dekSize}px`,
                    color: '#0f766e',
                    marginTop: '20px',
                    lineHeight: 1.3,
                  },
                  children: dek,
                },
              },
            ],
          },
        },
        // Footer bar — teal, pinned at bottom
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              height: '120px',
              backgroundColor: '#0f766e',
              padding: '0 84px',
            },
            children: [
              // Bar-left: name or empty
              {
                type: 'span',
                props: {
                  style: {
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: '28px',
                    color: '#fafaf9',
                  },
                  children: name,
                },
              },
              // Bar-right: lhocke.dev
              {
                type: 'span',
                props: {
                  style: {
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: '28px',
                    color: 'rgba(250,250,249,0.88)',
                  },
                  children: 'lhocke.dev',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// GET handler — renders and returns the PNG
// ---------------------------------------------------------------------------

export const GET: APIRoute = async ({ props }) => {
  const { title, dek, showName } = props as { title: string; dek: string; showName: boolean };
  const name = barLeft({ showName });

  const element = buildCardElement(title, dek, name);

  const svg = await satori(element as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: FONTS,
  });

  const resvg = new Resvg(svg, { logLevel: 'off' });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new Response(pngBuffer, {
    headers: { 'Content-Type': 'image/png' },
  });
};
