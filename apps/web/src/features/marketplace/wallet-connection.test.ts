import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WalletProvider } from './wallet';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

function host() {
  const values = new Map<string, string>();
  const events = new EventTarget();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  vi.stubGlobal('window', {
    localStorage,
    dispatchEvent: events.dispatchEvent.bind(events),
  });
  return { values, events, localStorage };
}

describe('explicit wallet disconnection', () => {
  it('persists across module reloads and publishes local identity invalidation', async () => {
    const browser = host();
    const connection = await import('./wallet-connection');
    const changed = vi.fn();
    browser.events.addEventListener(connection.walletConnectionEvent, changed);
    expect(connection.walletDisconnected()).toBe(false);
    expect(connection.setWalletDisconnected(true)).toBe(true);
    expect(changed).toHaveBeenCalledOnce();
    vi.resetModules();
    const reloaded = await import('./wallet-connection');
    expect(reloaded.walletDisconnected()).toBe(true);
    reloaded.setWalletDisconnected(false);
    expect(reloaded.walletDisconnected()).toBe(false);
  });

  it('blocks passive identity reads and invalidates a read completed after disconnect', async () => {
    host();
    const connection = await import('./wallet-connection');
    const { MarketplaceWallet } = await import('./wallet');
    const manifest = (await import('../../../../../deployments/sepolia.json'))
      .default;
    const request = vi
      .fn()
      .mockResolvedValue(['0x1111111111111111111111111111111111111111']);
    const wallet = new MarketplaceWallet(
      { request } as unknown as WalletProvider,
      manifest as ConstructorParameters<typeof MarketplaceWallet>[1],
    );
    let finish!: (chain: number) => void;
    vi.spyOn(wallet.publicClient, 'getChainId').mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          finish = resolve;
        }),
    );
    const reading = wallet.identity();
    await vi.waitFor(() => expect(finish).toBeDefined());
    connection.setWalletDisconnected(true);
    finish(11155111);
    expect(await reading).toEqual({ wallet: null, chainId: null });
    request.mockClear();
    expect(await wallet.identity()).toEqual({ wallet: null, chainId: null });
    expect(request).not.toHaveBeenCalled();
  });

  it('stays disconnected in memory when persistence fails', async () => {
    const browser = host();
    browser.localStorage.setItem = () => {
      throw new Error('Quota exceeded');
    };
    const connection = await import('./wallet-connection');
    expect(connection.setWalletDisconnected(true)).toBe(false);
    expect(connection.walletDisconnected()).toBe(true);
    connection.setWalletDisconnected(false);
    expect(connection.walletDisconnected()).toBe(false);
  });

  it('asks only to revoke site account permissions and tolerates unsupported wallets', async () => {
    const { revokeWalletConnection } = await import('./wallet-connection');
    const request = vi.fn().mockResolvedValue(null);
    const provider = { request } as unknown as WalletProvider;
    expect(await revokeWalletConnection(provider)).toBe(true);
    expect(request).toHaveBeenCalledWith({
      method: 'wallet_revokePermissions',
      params: [{ eth_accounts: {} }],
    });
    request.mockRejectedValueOnce(new Error('unsupported or rejected'));
    expect(await revokeWalletConnection(provider)).toBe(false);
  });
});
