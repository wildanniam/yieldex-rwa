'use client';
/* External wallet and receipt journal synchronization never broadcasts. */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ListingDetail, Position } from '@rwa/shared';
import type { DeploymentManifest } from '@rwa/shared/config';
import { useWalletSession } from './use-wallet-session';
import { mergeSnapshots } from './data';
import { validJournalEntry, type TrackedTransaction } from './wallet';

type Context = {
  manifest: DeploymentManifest;
  access: ReturnType<typeof useWalletSession>;
  tracked: TrackedTransaction[];
  remember: (item: TrackedTransaction) => void;
  positions: Position[];
  listings: ListingDetail[];
  revision: number;
  trackingError: string;
  verifiedReceipts: ReadonlySet<string>;
};
const PlatformContext = createContext<Context | null>(null);
export const useOptionalPlatform = () => useContext(PlatformContext);
export function usePlatform() {
  const context = useOptionalPlatform();
  if (!context) throw new Error('Platform connection unavailable');
  return context;
}
export function PlatformProvider({
  manifest,
  children,
}: {
  manifest: DeploymentManifest;
  children: ReactNode;
}) {
  const access = useWalletSession(manifest);
  const [tracked, setTracked] = useState<TrackedTransaction[]>([]);
  const [overlays, setOverlays] = useState<{
    wallet: string | null;
    receipts: Record<
      string,
      { position: Position | null; listing: ListingDetail | null }
    >;
  }>({ wallet: null, receipts: {} });
  const [revision, setRevision] = useState(0);
  const [trackingError, setTrackingError] = useState('');
  const [verifiedReceipts, setVerifiedReceipts] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const rows = useRef(tracked);
  const key = `rwa-transactions:${manifest.chainId}:${manifest.market}`;
  const load = useCallback(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
      return Array.isArray(stored)
        ? stored
            .filter(
              (t): t is TrackedTransaction =>
                validJournalEntry(t) &&
                t.chainId === manifest.chainId &&
                t.market === manifest.market,
            )
            .slice(-50)
        : [];
    } catch {
      return [];
    }
  }, [key, manifest]);
  const remember = useCallback(
    (item: TrackedTransaction) => {
      const stored = new Map(
        [...rows.current, ...load()].map((t) => [t.hash, t]),
      );
      stored.set(item.hash, item);
      const next = [...stored.values()].slice(-50);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        setTrackingError(
          'Storage unavailable. Keep the transaction hash before leaving this page.',
        );
      }
      rows.current = next;
      setTracked(next);
    },
    [load, key],
  );
  useEffect(() => {
    const sync = () => {
      const next = load();
      rows.current = next;
      setTracked(next);
    };
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) sync();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [load, key]);
  useEffect(() => {
    const wallet = access.wallet,
      who = access.identity.wallet;
    setOverlays({ wallet: who, receipts: {} });
    setVerifiedReceipts(new Set());
    if (!wallet || !who || access.identity.chainId !== manifest.chainId) return;
    let active = true;
    const watching = new Set<string>();
    const tick = () => {
      for (const item of rows.current) {
        // Final receipts are read once after mount too, to reconstruct overlays after refresh.
        if (
          item.wallet !== who ||
          ['CANCELLED', 'REVERTED'].includes(item.status) ||
          watching.has(item.hash)
        )
          continue;
        watching.add(item.hash);
        void wallet
          .track(item, (update) => {
            if (active) remember(update);
          })
          .then((result) => {
            if (!active) return;
            setTrackingError('');
            setVerifiedReceipts((old) => new Set([...old, item.hash]));
            setOverlays((old) => {
              const receipts = { ...old.receipts };
              // Reorg/replacement invalidates the corresponding provisional state.
              if (result.position || result.listing)
                receipts[item.hash] = {
                  position: result.position,
                  listing: result.listing,
                };
              else delete receipts[item.hash];
              return { wallet: who, receipts };
            });
            if (
              ['CONFIRMED', 'FINALIZED'].includes(result.tracked.status) &&
              !['CONFIRMED', 'FINALIZED'].includes(item.status)
            )
              setRevision((n) => n + 1);
            if (result.tracked.status === 'REORGED') setRevision((n) => n + 1);
            if (result.tracked.status !== 'FINALIZED')
              watching.delete(item.hash);
          })
          .catch(() => {
            if (active)
              setTrackingError(
                'Receipt verification is still pending. Your hash is saved; do not send again.',
              );
            watching.delete(item.hash);
          });
      }
    };
    tick();
    const timer = setInterval(tick, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [
    access.wallet,
    access.identity.wallet,
    access.identity.chainId,
    manifest.chainId,
    remember,
  ]);
  const same =
    overlays.wallet === access.identity.wallet &&
    access.identity.chainId === manifest.chainId;
  const receipts = same ? Object.values(overlays.receipts) : [];
  const positions = receipts.reduce<Position[]>(
    (all, r) =>
      mergeSnapshots(all, r.position ? [r.position] : [], (p) => p.positionKey),
    [],
  );
  const details = new Map<string, ListingDetail>();
  for (const r of receipts)
    if (r.listing) {
      const previous = details.get(r.listing.listing.listingKey);
      if (
        !previous ||
        BigInt(r.listing.listing.snapshot.blockNumber) >
          BigInt(previous.listing.snapshot.blockNumber)
      )
        details.set(r.listing.listing.listingKey, r.listing);
    }
  return (
    <PlatformContext.Provider
      value={{
        manifest,
        access,
        tracked: tracked.filter((t) => t.wallet === access.identity.wallet),
        remember,
        positions,
        listings: [...details.values()],
        revision,
        trackingError,
        verifiedReceipts: same ? verifiedReceipts : new Set(),
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}
