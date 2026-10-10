import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PlatformShell } from './shell';

const route = vi.hoisted(() => ({ pathname: '/marketplace/example-apple' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));
vi.mock('@/components/ChatbotWrapper', () => ({
  useAssistant: () => ({ open: vi.fn(), busy: false }),
}));

describe('shared product shell', () => {
  it('marks the marketplace active on detail pages and exposes one main', () => {
    const html = renderToStaticMarkup(
      createElement(PlatformShell, null, 'Offer content'),
    );
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(
      /href="\/marketplace"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/marketplace"/,
    );
    expect(html).toContain('Offer content');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/sell"');
    expect(html).toContain('href="/lab"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('href="/settings"');
  });
  it('keeps connection an explicit wallet handoff without claiming a session', () => {
    route.pathname = '/dashboard';
    const html = renderToStaticMarkup(
      createElement(PlatformShell, null, 'Portfolio'),
    );
    expect(html).toContain('Nothing is signed here.');
    expect(html).toContain('Continue to wallet');
    expect(html).not.toContain('Wallet connected');
  });
});
