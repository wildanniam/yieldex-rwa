import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import deployment from '../../../../../deployments/sepolia.json';
import { YieldexLanding } from './page';

// Only session admission is replaced. This test renders the real landing and controls.
vi.mock('@/components/ChatbotWrapper', () => ({
  useAssistant: () => ({ open: vi.fn(), busy: false }),
}));

describe('landing server-rendered content', () => {
  it('renders meaningful content and navigation before hydration', () => {
    const html = renderToStaticMarkup(createElement(YieldexLanding));
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const anchor of [
      'top',
      'main-content',
      'why-yieldex',
      'how-it-works',
      'calculator',
      'assistant',
      'assets',
      'risks',
    ])
      expect(html).toContain(`id="${anchor}"`);
    for (const route of ['/lab', '/workspace', '/design-system'])
      expect(html).toContain(`href="${route}"`);
    expect(html).toContain('<noscript>');
    expect(html).toContain('Enable JavaScript to change scenarios.');
    expect(html).toContain('aria-label="Open navigation"');
    expect(html).toContain('aria-expanded="false"');
  });
  it('uses the actual deployment for explorer links and labels examples honestly', () => {
    const html = renderToStaticMarkup(createElement(YieldexLanding));
    for (const asset of deployment.assets) {
      expect(html).toContain(asset.symbol);
      expect(html).toContain(
        `https://sepolia.etherscan.io/address/${asset.token}`,
      );
    }
    expect(html).toContain(
      `https://sepolia.etherscan.io/address/${deployment.market}`,
    );
    expect(html).toContain('Interactive example · No transaction');
    expect(html).toContain('No real shares or real-world backing.');
    expect(html).toContain('Actual claims are paid in asset tokens.');
    expect(html).not.toContain('demoNVDA');
    expect(html).not.toContain('demoKO');
  });
  it('provides an honest initial loss scenario and native disclosure', () => {
    const html = renderToStaticMarkup(createElement(YieldexLanding));
    expect(html).toContain('−40.00');
    expect(html).toContain('−44.44');
    expect(html).toContain('min="10" max="90" step="10"');
    expect(html).toContain('<details');
    expect(html).toContain(
      'completed payouts cannot automatically be clawed back.',
    );
  });
});
