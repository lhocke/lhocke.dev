// scripts/og-smoke-test.mjs
// Temporary smoke test: proves satori + resvg can render a card with our fonts.
// Run once after Task 1 to confirm the font pipeline; removed in Task 7 commit.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const fontsDir = join(root, 'src/assets/og-fonts');

const newsreader600 = readFileSync(join(fontsDir, 'newsreader-600.ttf'));
const newsreaderItalic = readFileSync(join(fontsDir, 'newsreader-italic.ttf'));
const inter600 = readFileSync(join(fontsDir, 'inter-600.ttf'));
const inter400 = readFileSync(join(fontsDir, 'inter-400.ttf'));

const element = {
  type: 'div',
  props: {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: '1200px',
      height: '630px',
      backgroundColor: '#fafaf9',
      padding: '84px',
    },
    children: [
      {
        type: 'div',
        props: {
          style: {
            fontFamily: 'Newsreader',
            fontWeight: 600,
            fontSize: '80px',
            color: '#1c1917',
            lineHeight: 1.07,
          },
          children: 'Smoke test',
        },
      },
      {
        type: 'div',
        props: {
          style: {
            fontFamily: 'Newsreader',
            fontStyle: 'italic',
            fontSize: '30px',
            color: '#0f766e',
            marginTop: '16px',
          },
          children: 'font pipeline works',
        },
      },
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '120px',
            backgroundColor: '#0f766e',
            padding: '0 84px',
          },
          children: [
            {
              type: 'span',
              props: {
                style: { fontFamily: 'Inter', fontWeight: 600, fontSize: '28px', color: '#fafaf9' },
                children: 'Dylan Ishihara',
              },
            },
            {
              type: 'span',
              props: {
                style: { fontFamily: 'Inter', fontWeight: 400, fontSize: '28px', color: 'rgba(250,250,249,0.88)' },
                children: 'lhocke.dev',
              },
            },
          ],
        },
      },
    ],
  },
};

const svg = await satori(element, {
  width: 1200,
  height: 630,
  fonts: [
    { name: 'Newsreader', data: newsreader600, weight: 600, style: 'normal' },
    { name: 'Newsreader', data: newsreaderItalic, weight: 600, style: 'italic' },
    { name: 'Inter', data: inter600, weight: 600, style: 'normal' },
    { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
  ],
});

const resvg = new Resvg(svg);
const pngData = resvg.render();
const pngBuffer = pngData.asPng();

// Verify dimensions from the rendered output
if (pngData.width !== 1200 || pngData.height !== 630) {
  console.error(`❌ Smoke test FAILED: expected 1200×630, got ${pngData.width}×${pngData.height}`);
  process.exit(1);
}
if (pngBuffer.length < 10000) {
  console.error(`❌ Smoke test FAILED: PNG too small (${pngBuffer.length} bytes) — fonts may not be embedded`);
  process.exit(1);
}

writeFileSync('smoke-test-card.png', pngBuffer);
console.log(`✅ Smoke test passed: 1200×630, ${pngBuffer.length} bytes → smoke-test-card.png`);
console.log('   Inspect smoke-test-card.png visually to confirm Newsreader + Inter render correctly.');
console.log('   Delete smoke-test-card.png and scripts/og-smoke-test.mjs after confirming.');
