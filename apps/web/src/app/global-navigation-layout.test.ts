import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appRoot = resolve(__dirname);
const layoutSource = readFileSync(resolve(appRoot, 'layout.tsx'), 'utf8');
const sidebarSource = readFileSync(
  resolve(appRoot, '../components/navigation/app-sidebar.tsx'),
  'utf8',
);
const topBarSource = readFileSync(
  resolve(appRoot, '../components/navigation/app-top-bar.tsx'),
  'utf8',
);

const destinations = [
  'dashboard',
  'marketplace',
  'sell',
  'listings',
  'positions',
  'claims',
  'ai-assistant',
  'activity',
  'assets',
  'demo-console',
  'settings',
];

describe('global navigation layout contracts', () => {
  it('renders the shared shell and content panel', () => {
    expect(layoutSource).toContain('<AppSidebar />');
    expect(layoutSource).toContain('<AppTopBar />');
    expect(layoutSource).toContain('min-h-screen bg-canvas text-text-1');
    expect(layoutSource).toContain('overflow-x-hidden');
    expect(layoutSource).toContain('<main className="flex-1 p-8">');
    expect(topBarSource).toContain('sticky top-0 z-40 flex h-[72px]');
  });

  it('uses pathname active state semantics in the sidebar', () => {
    expect(sidebarSource).toContain('usePathname');
    expect(sidebarSource).toContain('bg-tint text-green-text');
    expect(sidebarSource).toContain('aria-current');
    expect(sidebarSource).toContain(
      'w-[248px] shrink-0 border-r border-border',
    );
  });

  it('keeps every navigation destination routable', () => {
    for (const destination of destinations) {
      expect(existsSync(resolve(appRoot, destination, 'page.tsx'))).toBe(true);
    }
  });
});
