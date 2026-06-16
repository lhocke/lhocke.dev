// src/lib/og.test.ts
// node:test unit tests for pure og.ts helpers.
// Run: node --experimental-strip-types --test src/lib/og.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import only the pure helpers (no astro:content import triggered)
import { ogImagePath, pickTier, barLeft, OG_WIDTH, OG_HEIGHT } from './og.ts';

describe('OG_WIDTH / OG_HEIGHT', () => {
  it('exports correct dimensions', () => {
    assert.equal(OG_WIDTH, 1200);
    assert.equal(OG_HEIGHT, 630);
  });
});

describe('pickTier', () => {
  it('returns large tier for short title (≤38 chars)', () => {
    const tier = pickTier('Short Title');
    assert.equal(tier.titleSize, 80);
    assert.equal(tier.dekSize, 30);
  });

  it('returns medium tier for medium title (39–62 chars)', () => {
    const tier = pickTier('A Medium Length Title That Has Around Fifty Characters Here');
    // 39–62 chars → 64px
    assert.equal(tier.titleSize, 64);
  });

  it('returns small tier for long title (>62 chars)', () => {
    const tier = pickTier(
      'A Very Long Title That Exceeds Sixty-Two Characters And Should Step Down A Tier'
    );
    assert.equal(tier.titleSize, 52);
  });

  it('boundary: exactly 38 chars → large tier', () => {
    const title = 'A'.repeat(38);
    assert.equal(pickTier(title).titleSize, 80);
  });

  it('boundary: exactly 39 chars → medium tier', () => {
    const title = 'A'.repeat(39);
    assert.equal(pickTier(title).titleSize, 64);
  });

  it('boundary: exactly 62 chars → medium tier', () => {
    const title = 'A'.repeat(62);
    assert.equal(pickTier(title).titleSize, 64);
  });

  it('boundary: exactly 63 chars → small tier', () => {
    const title = 'A'.repeat(63);
    assert.equal(pickTier(title).titleSize, 52);
  });
});

describe('ogImagePath', () => {
  it('maps / to /og/home.png', () => {
    assert.equal(ogImagePath('/'), '/og/home.png');
  });

  it('maps /notes/ (trailing slash) to /og/notes.png', () => {
    assert.equal(ogImagePath('/notes/'), '/og/notes.png');
  });

  it('maps /notes (no trailing slash) to /og/notes.png', () => {
    assert.equal(ogImagePath('/notes'), '/og/notes.png');
  });

  it('maps /zork/ to /og/zork.png', () => {
    assert.equal(ogImagePath('/zork/'), '/og/zork.png');
  });

  it('maps /zork (no trailing slash) to /og/zork.png', () => {
    assert.equal(ogImagePath('/zork'), '/og/zork.png');
  });

  it('maps /notes/<slug>/ to /og/notes/<slug>.png', () => {
    assert.equal(ogImagePath('/notes/athena-investigation-pipeline/'), '/og/notes/athena-investigation-pipeline.png');
  });

  it('maps /notes/<slug> (no trailing slash) to /og/notes/<slug>.png', () => {
    assert.equal(ogImagePath('/notes/athena-investigation-pipeline'), '/og/notes/athena-investigation-pipeline.png');
  });

  it('falls back to /og/home.png for unknown paths', () => {
    assert.equal(ogImagePath('/unknown-page'), '/og/home.png');
  });
});

describe('barLeft', () => {
  it('returns empty string when showName=false (homepage)', () => {
    assert.equal(barLeft({ showName: false }), '');
  });

  it('returns "Dylan Ishihara" when showName=true', () => {
    assert.equal(barLeft({ showName: true }), 'Dylan Ishihara');
  });
});
