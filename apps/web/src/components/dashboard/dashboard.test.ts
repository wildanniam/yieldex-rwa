import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PortfolioDashboard, type DashboardPreview } from './dashboard';
vi.mock('@/components/ChatbotWrapper', () => ({
  useAssistant: () => ({ open: vi.fn(), busy: false }),
}));
const render = (initialPreview: DashboardPreview) =>
  renderToStaticMarkup(createElement(PortfolioDashboard, { initialPreview }));
describe('dashboard presentation boundaries', () => {
  it('starts empty without inventing a connected identity or activity', () => {
    const html = render('empty');
    expect(html).toContain('No positions yet');
    expect(html).toContain('Nothing to claim yet');
    expect(html).toContain('Your story starts here');
    expect(html).not.toContain('Income allocated');
    expect(html).toContain('No wallet connected');
    expect(html).toContain('disabled=""');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });
  it('labels examples and avoids fabricated dollar valuations or receipts', () => {
    const html = render('example');
    expect(html).toContain('Illustrative data');
    expect(html).toContain('Not live receipts');
    expect(html).toContain('0.50');
    expect(html).toContain('demoAAPL');
    expect(html).toContain('demoMSFT');
    expect(html).toContain('demoSPY');
    expect(html).not.toContain('dNVDA');
    expect(html).not.toContain('$50');
    expect(html).not.toContain('etherscan.io/tx');
    expect(html).toContain(
      'No wallet is connected here and no transaction will be sent',
    );
  });
  it.each(['loading', 'error'] as const)(
    'does not present unavailable %s data as empty balances',
    (state) => {
      const html = render(state);
      expect(html).toContain('Balance unavailable');
      expect(html).not.toContain('0.00');
      expect(html).not.toContain('Income allocated');
      expect(html).not.toContain('No positions yet');
      if (state === 'error') expect(html).toContain('Retry preview');
      else expect(html).toContain('aria-busy="true"');
    },
  );
  it('renders accessible navigation and no speculative product routes', () => {
    const html = render('empty');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('href="/lab"');
    expect(html).toContain('href="/"');
    expect(html).not.toContain('href="/marketplace"');
    expect(html).toContain('Enable JavaScript');
  });
});
