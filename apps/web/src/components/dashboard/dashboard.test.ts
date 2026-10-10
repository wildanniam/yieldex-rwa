import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PortfolioDashboard } from './dashboard';
const state = vi.hoisted(() => ({
  who: null as string | null,
  data: null as null | { claims: unknown[] },
  error: '',
  loading: false,
}));
vi.mock('@/features/marketplace/platform-provider', () => ({
  usePlatform: () => ({
    access: { identity: { wallet: state.who }, session: null },
  }),
}));
vi.mock('@/features/marketplace/use-portfolio', () => ({
  useAssets: () => ({ data: { items: [] }, refresh: vi.fn() }),
  usePortfolio: () => ({
    data: state.data,
    positions: [],
    error: state.error,
    loading: state.loading,
    refresh: vi.fn(),
  }),
}));
vi.mock('@/features/marketplace/transaction-panel', () => ({
  WalletActivity: () => null,
  TransactionPanel: () => null,
}));
const render = () => renderToStaticMarkup(createElement(PortfolioDashboard));
describe('portfolio data boundaries', () => {
  it('does not call disconnected balances zero or invent activity', () => {
    state.who = null;
    state.data = null;
    const html = render();
    expect(html).toContain('Connect to view your portfolio');
    expect(html).not.toContain('0.00');
    expect(html).not.toContain('Income allocated');
    expect(html).not.toContain('UI preview');
  });
  it('distinguishes failed account reads from an empty account', () => {
    state.who = '0x' + '1'.repeat(40);
    state.data = null;
    state.error = 'INDEXER_UNAVAILABLE';
    const html = render();
    expect(html).toContain('Balance unavailable');
    expect(html).toContain('Try again');
    expect(html).not.toContain('No income rights yet');
    expect(html).not.toContain('No income yet');
  });
  it('only shows empty state once canonical account data exists', () => {
    state.error = '';
    state.data = { claims: [] };
    const html = render();
    expect(html).toContain('No income yet');
    expect(html).toContain('No income rights yet');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
    expect(html).not.toContain('UI preview');
  });
});
