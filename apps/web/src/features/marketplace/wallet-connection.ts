'use client';

import type { WalletProvider } from './wallet';

export const walletConnectionKey = 'yieldex:wallet-disconnected:v1';
export const walletConnectionEvent = 'yieldex:wallet-connection-changed';
let storageUnavailable = false;
let memoryDisconnected = false;

// Structural browser type keeps the wallet client usable by Node-based QA tools.
function browser() {
  return (
    globalThis as typeof globalThis & {
      window?: {
        localStorage: {
          getItem(key: string): string | null;
          setItem(key: string, value: string): void;
        };
        dispatchEvent(event: Event): boolean;
      };
    }
  ).window;
}

/** App disconnection is distinct from provider permissions and token approvals. */
export function walletDisconnected() {
  const host = browser();
  if (!host) return false;
  if (storageUnavailable) return memoryDisconnected;
  try {
    return host.localStorage.getItem(walletConnectionKey) === 'true';
  } catch {
    return memoryDisconnected;
  }
}

export function setWalletDisconnected(disconnected: boolean) {
  const host = browser();
  if (!host) return false;
  memoryDisconnected = disconnected;
  let persisted = true;
  try {
    host.localStorage.setItem(walletConnectionKey, String(disconnected));
  } catch {
    storageUnavailable = true;
    persisted = false;
  }
  host.dispatchEvent(new Event(walletConnectionEvent));
  return persisted;
}

export async function revokeWalletConnection(provider: WalletProvider) {
  try {
    await provider.request({
      method: 'wallet_revokePermissions',
      params: [{ eth_accounts: {} }],
    });
    return true;
  } catch {
    // Unsupported wallets and rejected requests still stay locally disconnected.
    return false;
  }
}
