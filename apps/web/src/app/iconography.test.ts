import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const componentSource = readFileSync(
  resolve(__dirname, '../components/ui/icon.tsx'),
  'utf8',
);
const iconDirectory = resolve(__dirname, '../../public/icons');

describe('custom iconography', () => {
  it('uses next/image and the discovered SVG inventory', () => {
    expect(componentSource).toContain("from 'next/image'");
    expect(componentSource).toContain("'search'");
    expect(componentSource).toContain("'wallet'");
    expect(componentSource).toContain("'layout-grid'");
    expect(componentSource).toContain("'list'");
    expect(componentSource).not.toContain('lucide-react');
  });

  it('supports default and custom dimensions with accessible fallback behavior', () => {
    expect(componentSource).toContain('size = 20');
    expect(componentSource).toContain('height ?? size');
    expect(componentSource).toContain('width ?? size');
    expect(componentSource).toContain('alt = name');
    expect(componentSource).toContain('console.warn');
    expect(componentSource).toContain('role="img"');
  });

  it('keeps representative assets present in the canonical directory', () => {
    expect(
      readFileSync(resolve(iconDirectory, 'search.svg'), 'utf8'),
    ).toContain('<svg');
    expect(
      readFileSync(resolve(iconDirectory, 'wallet.svg'), 'utf8'),
    ).toContain('<svg');
  });
});
