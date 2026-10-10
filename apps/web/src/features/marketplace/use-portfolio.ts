'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { erc20Abi, type Address } from 'viem';
import type {
  Asset,
  AssetsPage,
  ChainSnapshot,
  ClaimsPage,
  ClaimBalance,
  Position,
  PositionsPage,
} from '@rwa/shared';
import { usePlatform } from './platform-provider';
import { useRead } from './use-read';
import { checkedResponse, marketRequest, walletError } from './client-api';
import { mergeSnapshots } from './data';

export function useAssets() {
  const { manifest: m, revision } = usePlatform();
  return useRead<AssetsPage>(
    `/chains/${m.chainId}/registries/${m.registry}/assets`,
    'api.AssetsPage',
    revision,
  );
}
export function useBalances(assets: Asset[]) {
  const { access, manifest, revision } = usePlatform();
  const [retry, setRetry] = useState(0);
  const key = `${access.identity.wallet}:${access.identity.chainId}:${assets.map((a) => a.assetKey).join(',')}`;
  const [state, setState] = useState<{
    key: string;
    amounts: Record<string, string>;
    error: string;
    loading: boolean;
  }>({ key: '', amounts: {}, error: '', loading: false });
  const enabled =
    !!access.identity.wallet &&
    !!access.wallet &&
    access.identity.chainId === manifest.chainId;
  useEffect(() => {
    if (!enabled || !assets.length) return;
    let active = true;
    setState({ key, amounts: {}, error: '', loading: true });
    const wallet = access.wallet!;
    void (async () => {
      const blockNumber = await wallet.publicClient.getBlockNumber();
      const pairs = await Promise.all(
        assets.map(
          async (a) =>
            [
              a.assetKey,
              (
                await wallet.publicClient.readContract({
                  address: a.token.address as Address,
                  abi: erc20Abi,
                  functionName: 'balanceOf',
                  args: [access.identity.wallet as Address],
                  blockNumber,
                })
              ).toString(),
            ] as const,
        ),
      );
      if (active)
        setState({
          key,
          amounts: Object.fromEntries(pairs),
          error: '',
          loading: false,
        });
    })().catch((e) => {
      if (active)
        setState({ key, amounts: {}, error: walletError(e), loading: false });
    });
    return () => {
      active = false;
    };
    // key represents the selected account, network and asset identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, revision, retry, access.wallet]);
  return {
    ...(state.key === key && enabled
      ? state
      : { amounts: {} as Record<string, string>, error: '', loading: enabled }),
    refresh: () => setRetry((n) => n + 1),
  };
}
type Portfolio = {
  positions: Position[];
  claims: ClaimBalance[];
  snapshot: ChainSnapshot;
};
export function usePortfolio() {
  const { access, manifest: m, revision, positions: overlays } = usePlatform();
  const [retry, setRetry] = useState(0);
  const refresh = useCallback(() => setRetry((n) => n + 1), []);
  const key = `${m.chainId}:${m.market}:${access.identity.wallet}`;
  const [state, setState] = useState<{
    key: string;
    data: Portfolio | null;
    error: string;
    loading: boolean;
  }>({ key: '', data: null, error: '', loading: true });
  useEffect(() => {
    const who = access.identity.wallet;
    if (!who) return;
    const controller = new AbortController();
    setState({ key, data: null, error: '', loading: true });
    void (async () => {
      const path = `/chains/${m.chainId}/markets/${m.market}/accounts/${who}`;
      const positions: Position[] = [];
      let cursor: string | null = null,
        snapshot: ChainSnapshot | undefined;
      const seen = new Set<string>();
      do {
        const q = new URLSearchParams({ limit: '20' });
        if (cursor) q.set('cursor', cursor);
        const page = checkedResponse<PositionsPage>(
          'api.PositionsPage',
          await marketRequest(`${path}/positions?${q}`, {
            signal: controller.signal,
          }),
        );
        if (snapshot && snapshot.blockHash !== page.snapshot.blockHash)
          throw new Error('Snapshot changed. Refresh your portfolio.');
        snapshot = page.snapshot;
        positions.push(...page.items);
        cursor = page.pagination.nextCursor;
        if (cursor && (seen.has(cursor) || seen.size >= 250))
          throw new Error(
            'Portfolio pagination could not be completed. Retry loading.',
          );
        if (cursor) seen.add(cursor);
      } while (cursor);
      const cc = checkedResponse<ClaimsPage>(
        'api.ClaimsPage',
        await marketRequest(`${path}/claims`, { signal: controller.signal }),
      );
      let claims = cc.items;
      // Verify current claim balances so a finalized index cannot present an already-claimed amount.
      if (access.wallet && access.identity.chainId === m.chainId) {
        const latest = await access.wallet.reader.snapshot('latest');
        claims = await Promise.all(
          m.assets.map((a) =>
            access.wallet!.reader.claim(a.assetId, who, latest),
          ),
        );
      }
      if (!controller.signal.aborted)
        setState({
          key,
          data: { positions, claims, snapshot: snapshot! },
          error: '',
          loading: false,
        });
    })().catch((e) => {
      if (!controller.signal.aborted)
        setState({ key, data: null, error: walletError(e), loading: false });
    });
    return () => controller.abort();
  }, [
    key,
    access.wallet,
    access.identity.wallet,
    access.identity.chainId,
    m,
    retry,
    revision,
  ]);
  const current =
    state.key === key && access.identity.wallet
      ? state
      : { data: null, error: '', loading: !!access.identity.wallet };
  const positions = mergeSnapshots(
    current.data?.positions ?? [],
    overlays,
    (p) => p.positionKey,
  ).filter(
    (p) =>
      p.principalOwner === access.identity.wallet ||
      p.rightsOwner === access.identity.wallet,
  );
  return { ...current, positions, refresh };
}
