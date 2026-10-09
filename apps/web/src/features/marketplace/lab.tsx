'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BaseError,
  createWalletClient,
  custom,
  formatUnits,
  parseUnits,
  type Address,
} from 'viem';
import { foundry, sepolia } from 'viem/chains';
import type { DeploymentManifest } from '@rwa/shared/config';
import type {
  Asset,
  ClaimBalance,
  ListingDetail,
  Position,
  PreparedIntent,
  PrepareIntentRequest,
  Session,
  QuoteComparison,
  QuoteRequest,
} from '@rwa/shared';
import { validateData } from '@rwa/shared/validation';
import {
  MarketplaceWallet,
  validJournalEntry,
  type WalletProvider,
  type TrackedTransaction,
} from './wallet';
import styles from './lab.module.css';
const api = '/api/v1';
async function request(path: string, init?: RequestInit) {
  const r = await fetch(api + path, {
    ...init,
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!r.ok) {
    const b = await r.json().catch(() => null);
    throw new Error(b?.error?.code ?? 'SERVICE_UNAVAILABLE');
  }
  return r.status === 204 ? null : r.json();
}
const short = (s: string) => s.slice(0, 8) + '…' + s.slice(-4);
const amount = (s: string, decimals: number) =>
  formatUnits(BigInt(s), decimals);
function failure(error: unknown) {
  if (error instanceof BaseError) {
    const cause = error.walk((e) =>
      Boolean(e && typeof e === 'object' && 'code' in e && e.code === 4001),
    );
    if (
      cause &&
      typeof cause === 'object' &&
      'code' in cause &&
      cause.code === 4001
    )
      return 'Permintaan ditolak di wallet. Tidak ada pengiriman ulang otomatis.';
  }
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 4001
  )
    return 'Permintaan ditolak di wallet. Tidak ada pengiriman ulang otomatis.';
  if (
    error instanceof Error &&
    !('details' in error) &&
    error.message.length < 180
  )
    return error.message;
  return 'Permintaan gagal. Periksa wallet, jaringan, dan kondisi kontrak; lalu coba preview ulang.';
}
export function MarketLab({ manifest: m }: { manifest: DeploymentManifest }) {
  const [wallet, setWallet] = useState<MarketplaceWallet | null>(null),
    [address, setAddress] = useState<string | null>(null),
    [chain, setChain] = useState<number | null>(null),
    [session, setSession] = useState<Session | null>(null),
    [assets, setAssets] = useState<Asset[]>([]),
    [listings, setListings] = useState<ListingDetail[]>([]),
    [positions, setPositions] = useState<Position[]>([]),
    [claims, setClaims] = useState<ClaimBalance[]>([]),
    [preview, setPreview] = useState<PreparedIntent | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(''),
    [tracked, setTracked] = useState<TrackedTransaction[]>([]),
    [overlays, setOverlays] = useState<
      { listing: ListingDetail | null; position: Position | null }[]
    >([]),
    [quote, setQuote] = useState<QuoteComparison | null>(null);
  const epoch = useRef(0),
    lock = useRef(false),
    watching = useRef(new Set<string>()),
    addressRef = useRef<string | null>(null);
  const readSequence = useRef(0);
  const invalidate = useCallback(() => {
    epoch.current += 1;
  }, []);
  const storageKey = `rwa-transactions:${m.chainId}:${m.market}`;
  const marketPath = `/chains/${m.chainId}/markets/${m.market}`,
    assetPath = `/chains/${m.chainId}/registries/${m.registry}/assets`;
  const refresh = useCallback(
    async (who: string | null) => {
      const version = epoch.current,
        sequence = ++readSequence.current;
      const [aa, ll, pp, cc] = await Promise.all([
        request(assetPath),
        request(marketPath + '/listings?limit=20'),
        who
          ? request(marketPath + `/accounts/${who}/positions?limit=20`)
          : null,
        who ? request(marketPath + `/accounts/${who}/claims`) : null,
      ]);
      if (epoch.current !== version || sequence !== readSequence.current)
        return;
      if (
        !validateData('api.AssetsPage', aa).success ||
        !validateData('api.ListingsPage', ll).success
      )
        throw new Error('Schema data tidak sesuai.');
      setAssets(aa.items);
      setListings(ll.items);
      if (pp && cc) {
        if (
          !validateData('api.PositionsPage', pp).success ||
          !validateData('api.ClaimsPage', cc).success
        )
          throw new Error('Schema portfolio tidak sesuai.');
        setPositions(pp.items);
        setClaims((old) =>
          cc.items.map((incoming: ClaimBalance) => {
            const previous = old.find(
              (x) =>
                x.assetKey === incoming.assetKey &&
                x.account === incoming.account,
            );
            return previous &&
              BigInt(previous.snapshot.blockNumber) >
                BigInt(incoming.snapshot.blockNumber)
              ? previous
              : incoming;
          }),
        );
      } else {
        setPositions([]);
        setClaims([]);
      }
    },
    [assetPath, marketPath],
  );
  useEffect(() => {
    let active = true;
    let provider: WalletProvider | undefined;
    let callback: (() => void) | undefined;
    const boot = async () => {
      provider = (window as unknown as { ethereum?: WalletProvider }).ethereum;
      let instance: MarketplaceWallet | null = null;
      if (provider) {
        instance = new MarketplaceWallet(provider, m);
        const who = await instance.identity();
        if (!active) return;
        setWallet(instance);
        setAddress(who.wallet);
        addressRef.current = who.wallet;
        setChain(who.chainId);
      }
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
        if (Array.isArray(stored))
          setTracked(
            stored
              .filter(
                (t: unknown) =>
                  validJournalEntry(t) &&
                  t.chainId === m.chainId &&
                  t.market === m.market,
              )
              .slice(-20),
          );
      } catch {
        /* invalid journal ignored */
      }
      callback = () => {
        invalidate();
        setPreview(null);
        setSession(null);
        setPositions([]);
        setClaims([]);
        setOverlays([]);
        void request('/session', { method: 'DELETE' }).catch(() => {});
        void instance!.identity().then((who) => {
          if (!active) return;
          setAddress(who.wallet);
          addressRef.current = who.wallet;
          setChain(who.chainId);
          setNotice(
            'Wallet/jaringan berubah; preview dan sesi lama dibersihkan.',
          );
          void refresh(who.wallet).catch((e) => setNotice(failure(e)));
        });
      };
      provider?.on?.('accountsChanged', callback);
      provider?.on?.('chainChanged', callback);
      await refresh(addressRef.current);
      try {
        const s = await request('/session');
        if (
          active &&
          s.data.walletAddress === addressRef.current &&
          s.data.authChainId === m.chainId
        )
          setSession(s.data);
      } catch {
        /* Guest manual market remains available. */
      }
    };
    void boot().catch((e) => {
      if (active) setNotice(failure(e));
    });
    return () => {
      active = false;
      invalidate();
      if (callback) {
        provider?.removeListener?.('accountsChanged', callback);
        provider?.removeListener?.('chainChanged', callback);
      }
    };
  }, [m, refresh, storageKey, invalidate]);
  useEffect(() => {
    const timer = setInterval(() => {
      void refresh(address).catch((e) => setNotice(failure(e)));
    }, 15000);
    return () => clearInterval(timer);
  }, [refresh, address]);
  const remember = useCallback(
    (item: TrackedTransaction) => {
      setTracked((old) => {
        if (old.some((t) => JSON.stringify(t) === JSON.stringify(item)))
          return old;
        const next = [
          ...old.filter(
            (t) => t.hash !== item.hash && t.hash !== item.replacementHash,
          ),
          item,
        ].slice(-20);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey],
  );
  useEffect(() => {
    if (!wallet || chain !== m.chainId) return;
    const tick = () => {
      for (const item of tracked) {
        if (
          item.wallet !== address ||
          ['REVERTED', 'CANCELLED', 'FINALIZED'].includes(item.status) ||
          watching.current.has(item.hash)
        )
          continue;
        watching.current.add(item.hash);
        const version = epoch.current;
        void wallet
          .track(item, (value) => {
            if (version === epoch.current) remember(value);
          })
          .then(async (result) => {
            if (version !== epoch.current) return;
            if (result.listing || result.position)
              setOverlays((old) => {
                const key =
                  result.position?.positionKey ??
                  result.listing?.listing.listingKey;
                return [
                  result,
                  ...old.filter(
                    (x) =>
                      (x.position?.positionKey ??
                        x.listing?.listing.listingKey) !== key,
                  ),
                ].slice(0, 20);
              });
            if (result.tracked.status === 'REORGED') {
              setOverlays([]);
              setClaims([]);
            }
            if (
              address &&
              ['CONFIRMED', 'FINALIZED'].includes(result.tracked.status)
            ) {
              const receipt = await wallet.publicClient.getTransactionReceipt({
                  hash: result.tracked.replacementHash ?? result.tracked.hash,
                }),
                snapshot = await wallet.reader.snapshot(receipt.blockNumber);
              const direct = await Promise.all(
                m.assets.map((a) =>
                  wallet.reader.claim(a.assetId, address, snapshot),
                ),
              );
              if (version === epoch.current)
                setClaims((old) =>
                  direct.map((incoming) => {
                    const previous = old.find(
                      (x) =>
                        x.assetKey === incoming.assetKey &&
                        x.account === incoming.account,
                    );
                    return previous &&
                      BigInt(previous.snapshot.blockNumber) >
                        BigInt(incoming.snapshot.blockNumber)
                      ? previous
                      : incoming;
                  }),
                );
            }
            if (item.status === result.tracked.status) return;
            setNotice(
              result.tracked.status === 'CONFIRMED' ||
                result.tracked.status === 'FINALIZED'
                ? 'Receipt berhasil. Data di bawah dibaca langsung dari blok receipt; indeks publik bisa menyusul.'
                : 'Transaksi tidak menghasilkan aksi yang diminta.',
            );
            void refresh(address).catch((e) => setNotice(failure(e)));
          })
          .catch(() => {
            if (version === epoch.current)
              setNotice(
                'Receipt belum dapat dipastikan. Hash tersimpan; refresh untuk melanjutkan pengecekan.',
              );
          })
          .finally(() => watching.current.delete(item.hash));
      }
    };
    tick();
    const timer = setInterval(tick, 5000);
    return () => clearInterval(timer);
  }, [wallet, tracked, address, chain, m.chainId, m.assets, refresh, remember]);
  async function run(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice('Memproses…');
    try {
      await fn();
    } catch (e) {
      setNotice(failure(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function prepare(input: PrepareIntentRequest) {
    if (!wallet)
      throw new Error('Pasang wallet EVM untuk menyiapkan transaksi.');
    const version = epoch.current,
      p = await wallet.prepare(input);
    if (version !== epoch.current) return;
    setPreview(p);
    setNotice(
      p.state === 'BLOCKED'
        ? 'Ditahan: ' + p.blockers.join(', ')
        : 'Periksa preview sebelum membuka wallet.',
    );
  }
  async function login() {
    if (!wallet || !address || chain !== m.chainId)
      throw new Error('Hubungkan wallet pada chain marketplace.');
    const version = epoch.current;
    const challenge = await request('/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ walletAddress: address }),
    });
    if (!validateData('api.AuthChallengeResponse', challenge).success)
      throw new Error('Challenge tidak valid.');
    const signer = createWalletClient({
        account: address as Address,
        chain: m.chainId === 31337 ? foundry : sepolia,
        transport: custom(wallet.provider),
      }),
      signature = await signer.signMessage({ message: challenge.data.message });
    if (version !== epoch.current) return;
    const result = await request('/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        challengeId: challenge.data.challengeId,
        signature,
      }),
    });
    if (version === epoch.current) {
      setSession(result.data);
      setNotice(
        'Login berhasil. Transaksi tetap memerlukan konfirmasi wallet terpisah.',
      );
    }
  }
  const shownPositions = [
    ...new Map(
      [
        ...positions,
        ...overlays.flatMap((x) => (x.position ? [x.position] : [])),
      ]
        .sort((a, b) =>
          BigInt(a.snapshot.blockNumber) < BigInt(b.snapshot.blockNumber)
            ? -1
            : 1,
        )
        .map((p) => [p.positionKey, p]),
    ).values(),
  ];
  return (
    <main className={styles.lab}>
      <header>
        <p>LOCAL / TESTNET · FUNCTIONAL INTEGRATION</p>
        <h1>Income Rights Lab</h1>
        <p>
          Uji alur marketplace dengan token simulasi. Desain produk mengikuti UI
          tim.
        </p>
        <p>
          Chain {m.chainId} · Market <code>{short(m.market)}</code>
        </p>
      </header>
      <section aria-label="Wallet">
        <h2>Wallet</h2>
        <p data-testid="wallet-state">
          {address ?? 'Belum terhubung'} · chain {chain ?? '—'}
        </p>
        <button
          disabled={busy || !wallet}
          onClick={() =>
            void run(async () => {
              const who = await wallet!.identity(true);
              setAddress(who.wallet);
              addressRef.current = who.wallet;
              setChain(who.chainId);
              await refresh(who.wallet);
              setNotice('Wallet terhubung.');
            })
          }
        >
          Hubungkan wallet
        </button>
        <button
          disabled={busy || !wallet}
          onClick={() =>
            void run(async () => {
              await wallet!.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x' + m.chainId.toString(16) }],
              });
            })
          }
        >
          Pindah ke chain marketplace
        </button>
        <button
          disabled={busy || !address || chain !== m.chainId}
          onClick={() => void run(login)}
        >
          Login untuk riwayat privat
        </button>
        {session && (
          <>
            <p>Session: {short(session.walletAddress)}</p>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await request('/session', { method: 'DELETE' });
                  setSession(null);
                  setPreview(null);
                  setNotice('Logout berhasil.');
                })
              }
            >
              Logout
            </button>
          </>
        )}
        <button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await refresh(address);
              setNotice('Data publik diperbarui.');
            })
          }
        >
          Refresh data
        </button>
      </section>
      <p role="status" aria-live="polite" data-testid="notice">
        {notice}
      </p>
      <section aria-label="Buat penawaran" aria-busy={assets.length === 0}>
        <h2>Buat penawaran</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run(async () => {
              if (!wallet) throw new Error('Wallet diperlukan.');
              const a = assets.find((x) => x.assetId === f.get('asset'));
              if (!a || a.currentMultiplier === null)
                throw new Error(
                  'Data token belum tersedia. Pilih aset lain atau coba lagi nanti.',
                );
              const s = await wallet.reader.snapshot('latest'),
                deposit = parseUnits(
                  String(f.get('deposit')),
                  a.token.decimals,
                );
              await prepare({
                action: 'CREATE_PRIMARY_LISTING',
                assetKey: a.assetKey,
                depositTokenAmountAtomic: deposit.toString(),
                minReceivedShares: (
                  (deposit * 10n ** 18n) /
                  BigInt(a.currentMultiplier)
                ).toString(),
                incomeBps: Number(parseUnits(String(f.get('percent')), 2)),
                durationSeconds: Number(f.get('duration')),
                priceAtomic: parseUnits(String(f.get('price')), 6).toString(),
                listingExpiresAt: s.blockTimestamp + Number(f.get('lifetime')),
              });
            });
          }}
        >
          <label>
            Aset
            <select name="asset">
              {assets.map((a) => (
                <option
                  key={a.assetId}
                  value={a.assetId}
                  disabled={a.currentMultiplier === null}
                >
                  {a.token.symbol} · {a.syncStatus}
                </option>
              ))}
            </select>
          </label>
          <label>
            Jumlah token
            <input name="deposit" defaultValue="100" required />
          </label>
          <label>
            Bagian pendapatan (%)
            <input name="percent" defaultValue="50" required />
          </label>
          <label>
            Durasi hak (detik)
            <input name="duration" defaultValue="600" required />
          </label>
          <label>
            Harga (DemoUSD)
            <input name="price" defaultValue="90" required />
          </label>
          <label>
            Penawaran berlaku (detik)
            <input name="lifetime" defaultValue="300" required />
          </label>
          <p>
            Backing disimpan saat penawaran dibuat. Durasi hak mulai saat
            dibeli. Pembayaran pendapatan berupa token aset, bukan DemoUSD.
          </p>
          <button
            disabled={
              busy || assets.length === 0 || !address || chain !== m.chainId
            }
          >
            Preview penawaran
          </button>
        </form>
      </section>
      <section aria-label="Penawaran publik">
        <h2>Penawaran publik</h2>
        {listings.length === 0 && (
          <p>Belum ada penawaran pada indeks finalized.</p>
        )}
        {listings.map((d) => (
          <article key={d.listing.listingKey}>
            <h3>
              {d.asset.token.symbol} · listing {d.listing.listingId}
            </h3>
            <p>
              {d.position.incomeBps / 100}% pendapatan ·{' '}
              {amount(d.listing.priceAtomic, 6)} DemoUSD · {d.listing.kind} ·{' '}
              {d.asset.syncStatus}
            </p>
            <p>
              Penjual {short(d.listing.seller)} · durasi{' '}
              {d.position.durationSeconds} detik · snapshot{' '}
              {d.listing.snapshot.finality} #{d.listing.snapshot.blockNumber}
            </p>
            <button
              disabled={busy || !address || chain !== m.chainId}
              onClick={() =>
                void run(() =>
                  prepare({
                    action: 'BUY_LISTING',
                    listingKey: d.listing.listingKey,
                  }),
                )
              }
            >
              Preview beli #{d.listing.listingId}
            </button>
          </article>
        ))}
      </section>
      <section aria-label="Posisi">
        <h2>Posisi dan hasil receipt</h2>
        {shownPositions.map((p) => (
          <article key={p.positionKey}>
            <h3>
              Posisi {p.positionId} · {p.displayState}
            </h3>
            <p>
              Pokok {short(p.principalOwner)} · pemilik hak{' '}
              {p.rightsOwner ? short(p.rightsOwner) : 'belum ada'} ·{' '}
              {p.snapshot.finality} #{p.snapshot.blockNumber}
            </p>
            <p>
              Backing tercatat: {p.principalShares} share units · selesai{' '}
              {p.endAt ?? 'belum dimulai'}. Perubahan saldo akibat event yang
              belum diproses belum tentu pokok akhir.
            </p>
            <button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  prepare({
                    action: 'CHECKPOINT_POSITION',
                    positionKey: p.positionKey,
                    maxEvents: 32,
                  }),
                )
              }
            >
              Proses pendapatan #{p.positionId}
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  prepare({
                    action: 'SETTLE_POSITION',
                    positionKey: p.positionKey,
                    maxEvents: 32,
                  }),
                )
              }
            >
              Settlement #{p.positionId}
            </button>
            {p.principalOwner === address && (
              <button
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    prepare({
                      action: 'RELEASE_PRINCIPAL',
                      positionKey: p.positionKey,
                      maxEvents: 32,
                    }),
                  )
                }
              >
                Tarik pokok #{p.positionId}
              </button>
            )}
            {p.activeListingKey && (
              <button
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    prepare({
                      action: 'CANCEL_LISTING',
                      listingKey: p.activeListingKey!,
                    }),
                  )
                }
              >
                Batalkan listing posisi #{p.positionId}
              </button>
            )}
            {(p.rightsOwner === address || p.principalOwner === address) && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void run(async () => {
                    const s = await wallet!.reader.snapshot('latest');
                    await prepare({
                      action:
                        p.rightsOwner === address
                          ? 'CREATE_SECONDARY_LISTING'
                          : 'RELIST_PRIMARY_POSITION',
                      positionKey: p.positionKey,
                      priceAtomic: parseUnits(
                        String(f.get('resalePrice')),
                        6,
                      ).toString(),
                      listingExpiresAt: Math.min(
                        s.blockTimestamp + 300,
                        p.endAt ?? Number.MAX_SAFE_INTEGER,
                      ),
                    });
                  });
                }}
              >
                <label>
                  Harga jual hak (DemoUSD)
                  <input name="resalePrice" defaultValue="50" />
                </label>
                <button disabled={busy}>
                  Preview jual posisi #{p.positionId}
                </button>
              </form>
            )}
          </article>
        ))}
      </section>
      <section aria-label="Klaim">
        <h2>Klaim milik wallet</h2>
        {claims.map((c) => (
          <p key={c.assetKey}>
            {assets.find((a) => a.assetKey === c.assetKey)?.token.symbol ??
              'Aset'}
            : {c.claimShares} share units (
            {c.claimTokenAmountAtomic === null
              ? 'jumlah token belum tersedia'
              : amount(c.claimTokenAmountAtomic, 18) + ' token pada snapshot'}
            ).{' '}
            <button
              disabled={busy || c.claimShares === '0'}
              onClick={() =>
                void run(() =>
                  prepare({
                    action: 'CLAIM_INCOME',
                    assetKey: c.assetKey,
                    shares: c.claimShares,
                  }),
                )
              }
            >
              Preview klaim
            </button>
          </p>
        ))}
      </section>
      {preview && (
        <section aria-label="Preview transaksi" data-testid="preview">
          <h2>Review sebelum tanda tangan</h2>
          <p>
            {preview.request.action} · {preview.state} · chain {preview.chainId}
          </p>
          <p>
            Wallet {preview.walletAddress} · berlaku sampai chain time{' '}
            {preview.expiresAt}
          </p>
          {preview.purchaseSummary && (
            <p>
              Bayar {amount(preview.maxPriceAtomic!, 6)} DemoUSD ke{' '}
              {preview.purchaseSummary.listing.seller}. Hak{' '}
              {preview.purchaseSummary.position.incomeBps / 100}% atas{' '}
              {preview.purchaseSummary.asset.token.symbol},{' '}
              {preview.purchaseSummary.listing.kind === 'PRIMARY'
                ? preview.purchaseSummary.position.durationSeconds +
                  ' detik sejak pembelian'
                : 'hingga ' + preview.purchaseSummary.position.endAt}
              . Klaim pemilik lama tetap miliknya.
            </p>
          )}
          {preview.request.action === 'CREATE_PRIMARY_LISTING' && (
            <p>
              Kunci {amount(preview.request.depositTokenAmountAtomic, 18)} token
              aset sekarang. Jual {preview.request.incomeBps / 100}% pendapatan
              selama {preview.request.durationSeconds} detik sejak dibeli,
              seharga {amount(preview.request.priceAtomic, 6)} DemoUSD.
              Penawaran berakhir {preview.request.listingExpiresAt}.
            </p>
          )}
          {(preview.request.action === 'CREATE_SECONDARY_LISTING' ||
            preview.request.action === 'RELIST_PRIMARY_POSITION') && (
            <p>
              Tawarkan posisi {preview.request.positionKey.split(':').at(-1)}{' '}
              seharga {amount(preview.request.priceAtomic, 6)} DemoUSD hingga{' '}
              {preview.request.listingExpiresAt}. Seluruh hak ditawarkan;
              tenggat hak yang sudah aktif tetap.
            </p>
          )}
          {preview.request.action === 'CLAIM_INCOME' && (
            <p>
              Klaim {preview.request.shares} share units milik wallet ini untuk
              aset {preview.request.assetKey}. Pembayaran berupa token aset.
            </p>
          )}
          {preview.request.action === 'CANCEL_LISTING' && (
            <p>
              Batalkan penawaran {preview.request.listingKey.split(':').at(-1)}.
              Backing tetap tersimpan; penarikan merupakan aksi terpisah.
            </p>
          )}
          {[
            'CHECKPOINT_POSITION',
            'SETTLE_POSITION',
            'RELEASE_PRINCIPAL',
          ].includes(preview.request.action) &&
            'positionKey' in preview.request && (
              <p>
                Posisi {preview.request.positionKey.split(':').at(-1)}.{' '}
                {preview.request.action === 'RELEASE_PRINCIPAL'
                  ? 'Kirim pokok yang tersedia ke pemilik pokok; cadangan klaim tetap di kontrak.'
                  : 'Proses maksimal 32 event terverifikasi sesuai hak penerima; tidak memilih penerima baru.'}
              </p>
            )}
          <p>
            Backlog posisi: {preview.pendingEventCount} · simulasi{' '}
            {preview.simulation}
          </p>
          {preview.steps[0]?.kind === 'APPROVAL' && (
            <p>
              Izinkan tepat{' '}
              {amount(
                preview.steps[0].allowanceAmountAtomic!,
                preview.steps[0].allowanceToken!.decimals,
              )}{' '}
              {preview.steps[0].allowanceToken!.symbol} kepada market. Setelah
              berhasil, buat preview aksi lagi.
            </p>
          )}
          {preview.blockers.map((x) => (
            <p key={x}>
              Ditahan:{' '}
              {x === 'FinalityCoverageRequired'
                ? 'Data event belum dinyatakan lengkap sampai batas hak. Tunggu pemeriksaan sumber sebelum settlement atau penarikan pokok.'
                : x}
            </p>
          ))}
          {preview.disclosures.map((x) => (
            <p key={x}>{x}</p>
          ))}
          <button
            disabled={
              busy ||
              !wallet ||
              !['READY', 'NEEDS_APPROVAL'].includes(preview.state)
            }
            onClick={() =>
              void run(async () => {
                const current = preview,
                  version = epoch.current;
                await wallet!.send(current, remember);
                if (version === epoch.current) {
                  setPreview(null);
                  setNotice(
                    'Transaksi dikirim. Menunggu receipt; refresh tidak mengirim ulang.',
                  );
                }
              })
            }
          >
            Konfirmasi di wallet
          </button>
          <button disabled={busy} onClick={() => setPreview(null)}>
            Tutup preview
          </button>
        </section>
      )}
      <section aria-label="Transaksi">
        <h2>Transaksi wallet ini</h2>
        {tracked
          .filter((t) => t.wallet === address)
          .map((t) => (
            <p key={t.hash}>
              <code>{t.hash}</code> · <strong>{t.status}</strong>
              {m.chainId === 11155111 && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${t.replacementHash ?? t.hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Explorer
                </a>
              )}
            </p>
          ))}
      </section>
      <section aria-label="Quote">
        <h2>Bandingkan estimasi ETH → USDC</h2>
        <p>
          Data mainnet terpisah dari token demo. Tidak ada eksekusi swap atau
          bridge.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run(async () => {
              const quoteRequest: QuoteRequest = {
                requestId: crypto.randomUUID(),
                mode: 'EXACT_INPUT',
                amountAtomic: parseUnits(String(f.get('eth')), 18).toString(),
                sellAssetId: 'ETH',
                buyAssetId: 'USDC',
                originChainId: null,
                chainIds: [1, 42161, 8453],
                comparisonScope: 'HYPOTHETICAL_CHAINS',
                slippageBps: 50,
              };
              const result = await request('/quotes/compare', {
                method: 'POST',
                body: JSON.stringify(quoteRequest),
              });
              const parsed = validateData('quote.QuoteComparison', result.data);
              if (!parsed.success) throw new Error('Schema quote tidak valid.');
              setQuote(parsed.data);
              setNotice(
                'Estimasi diperbarui; perbandingan mengasumsikan dana sudah ada pada masing-masing chain.',
              );
            });
          }}
        >
          <label>
            ETH
            <input name="eth" defaultValue="1" />
          </label>
          <button disabled={busy}>Bandingkan</button>
        </form>
        {quote && <pre>{JSON.stringify(quote, null, 2)}</pre>}
      </section>
    </main>
  );
}
