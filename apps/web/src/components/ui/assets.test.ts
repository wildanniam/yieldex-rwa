import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { ICON_NAMES } from './icon';
const root = resolve(__dirname, '../../../../..');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'docs/design-system-assets.json'), 'utf8'),
) as {
  assets: { path: string; sha256: string; width: number; height: number }[];
};
describe('local design assets', () => {
  it('keeps the typed icon inventory in sync with nonempty canonical files', () => {
    const files = readdirSync(resolve(root, 'apps/web/public/icons'))
      .filter((n) => n.endsWith('.svg'))
      .map((n) => n.slice(0, -4))
      .sort();
    expect(files).toEqual([...ICON_NAMES].sort());
    expect(files).toHaveLength(40);
  });
  it('preserves reviewed exported geometry and source fingerprints', () => {
    for (const a of manifest.assets) {
      const content = readFileSync(resolve(root, a.path));
      expect(content.length).toBeGreaterThan(40);
      expect(createHash('sha256').update(content).digest('hex')).toBe(a.sha256);
      expect(content.toString()).toContain(
        `width="${a.width}" height="${a.height}"`,
      );
    }
  });
});
