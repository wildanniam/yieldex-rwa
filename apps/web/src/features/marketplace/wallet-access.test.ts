import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WalletControls } from './wallet-access';
import type { useWalletSession } from './use-wallet-session';
const access = (wallet: string | null, chainId = 11155111, verified = false) =>
  ({
    identity: { wallet, chainId },
    ready: true,
    wallet: {},
    session: verified ? { userId: 'verified-user' } : null,
  }) as ReturnType<typeof useWalletSession>;
const render = (state: ReturnType<typeof useWalletSession>) =>
  renderToStaticMarkup(
    createElement(WalletControls, { access: state, chainId: 11155111 }),
  );
describe('wallet connection versus authentication', () => {
  const account = '0x' + '11'.repeat(20);
  it('connected wallets show a badge and explain that chat verification is optional', () => {
    const html = render(access(account));
    expect(html).toContain('>Connected</span>');
    expect(html).toContain('Verify for saved chats');
    expect(html).toContain('Optional: sign a message');
    expect(html).not.toContain('Sign in with wallet');
    expect(html).not.toContain('>Connect wallet</span>');
  });
  it('verified wallets have status rather than another sign-in action', () => {
    const html = render(access(account, 11155111, true));
    expect(html).toContain('>Verified</span>');
    expect(html).toContain('Sign out');
    expect(html).not.toContain('Verify for saved chats');
  });
  it('wrong-chain wallets are directed to switching rather than signing', () => {
    const html = render(access(account, 1));
    expect(html).toContain('Switch to');
    expect(html).not.toContain('Verify for saved chats');
  });
});
