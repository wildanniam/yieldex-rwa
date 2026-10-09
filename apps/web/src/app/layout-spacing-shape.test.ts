import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appRoot = resolve(__dirname);
const layoutSource = readFileSync(
  resolve(appRoot, '../components/WorkspaceShell.tsx'),
  'utf8',
);
const pageSource = readFileSync(resolve(appRoot, 'workspace/page.tsx'), 'utf8');
const stylesSource = readFileSync(resolve(appRoot, 'globals.css'), 'utf8');
const tailwindSource = readFileSync(
  resolve(appRoot, '../../tailwind.config.ts'),
  'utf8',
);

describe('layout spacing and shape contracts', () => {
  it('keeps the desktop shell dimensions and responsive navigation landmarks', () => {
    expect(layoutSource).toContain('max-w-[1440px]');
    expect(layoutSource).toContain('max-w-[1200px]');
    expect(layoutSource).toContain('h-[72px]');
    expect(layoutSource).toContain('lg:w-[248px]');
    expect(layoutSource).toContain('aria-label="Navigasi utama"');
    expect(pageSource).toContain('id="main-content"');
    expect(pageSource).toContain('grid-cols-12');
    expect(pageSource).toContain('gap-6');
    expect(pageSource).toContain('lg:p-8');
  });

  it('keeps semantic radius and flat surface tokens wired', () => {
    expect(tailwindSource).toContain("card: '24px'");
    expect(tailwindSource).toContain("inner: '16px'");
    expect(tailwindSource).toContain("input: '12px'");
    expect(pageSource).toContain('surface-card');
    expect(pageSource).toContain('rounded-card');
    expect(pageSource).toContain('<GradientSamples />');
    expect(stylesSource).toContain('border: 1px solid var(--border)');
    expect(stylesSource).toContain('box-shadow: none');
    expect(stylesSource).toContain('border: 1px solid var(--input-border)');
  });

  it('keeps keyboard-visible form focus on green-2', () => {
    expect(stylesSource).toContain(':focus-visible');
    expect(stylesSource).toContain('outline: 2px solid var(--green-2)');
    expect(stylesSource).toContain('border-color: var(--green-2)');
  });
});
