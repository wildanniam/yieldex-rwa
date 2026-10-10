import { validateData } from '@rwa/shared/validation';
import { formatUnits } from 'viem';
import { liveListingHref } from '../../features/assistant/session';

type Event = Record<string, unknown>;
const unavailable =
  'Data belum dapat diverifikasi. Coba lagi; tidak ada angka pengganti yang dibuat.';

/** Only validated service DTOs determine narration for a tool-backed answer. */
export function toolNarrative(name: string, raw: unknown): string | null {
  const error = validateData('api.ErrorEnvelope', raw);
  if (error.success)
    return error.data.error.code === 'AUTH_REQUIRED'
      ? 'Login wallet melalui /wallet untuk membuat preview. Belum ada transaksi yang dikirim.'
      : unavailable;
  const value = raw && typeof raw === 'object' ? (raw as Event) : {};
  switch (name) {
    case 'searchListings': {
      if (value.kind !== 'LISTING_COMPARISON') return null;
      const p = validateData('api.ListingsPage', value.payload);
      if (!p.success) return null;
      return p.data.items.length
        ? 'Kartu menampilkan penawaran yang cocok dengan pencarian. Bandingkan harga, bagian pendapatan dan durasinya. Yang dijual adalah hak pendapatan; aset pokok tetap milik penjual dan pendapatan bisa nol.'
        : 'Belum ada penawaran yang cocok dengan pencarian ini. Coba filter lain atau periksa kembali nanti.';
    }
    case 'getAssetContext': {
      if (value.kind !== 'ASSET_CONTEXT') return null;
      const p = validateData('api.AssetContextResponse', value.payload);
      if (!p.success) return null;
      return (
        'Token pada kartu adalah aset backing yang dikunci oleh penjual. Posisi marketplace adalah hak terpisah atas bagian pendapatan untuk jangka waktu tertentu, bukan token backing itu sendiri. Pendapatan dibagikan sebagai shares token backing, bukan dividen USDC bulanan; pendapatan tidak dijamin.' +
        (p.data.data.isDemo
          ? ' Token ini merupakan simulasi di testnet, bukan bukti kepemilikan saham nyata.'
          : ' Periksa sumber dan risiko aset pada kartu.')
      );
    }
    case 'getPaymentQuotes': {
      if (value.kind !== 'QUOTE_COMPARISON') return null;
      const p = validateData('api.QuoteComparisonResponse', value.payload);
      if (!p.success) return null;
      const d = p.data.data;
      const status =
        d.rankingStatus === 'NO_AVAILABLE_QUOTES'
          ? 'Belum ada quote yang tersedia untuk dibandingkan.'
          : d.rankingStatus === 'UNRANKED'
            ? 'Quote ditampilkan tanpa rekomendasi peringkat karena hasilnya belum dapat dibandingkan secara setara.'
            : d.rankingBasis === 'GROSS_OUTPUT'
              ? 'Rekomendasi pada kartu memakai hasil keluar bruto dari provider, sebelum biaya tambahan yang belum lengkap.'
              : d.rankingBasis === 'GROSS_INPUT'
                ? 'Rekomendasi pada kartu memakai jumlah input dari provider, sebelum biaya tambahan yang belum lengkap.'
                : d.rankingBasis === 'NET_OUTPUT'
                  ? 'Rekomendasi pada kartu memakai hasil keluar bersih setelah biaya yang tercakup dalam perbandingan.'
                  : d.rankingBasis === 'TOTAL_INPUT'
                    ? 'Rekomendasi pada kartu memakai total input termasuk biaya yang tercakup dalam perbandingan.'
                    : 'Dasar rekomendasi dan rincian biaya ditampilkan pada kartu; jangan menganggap biaya yang tidak tersedia sebagai nol.';
      return (
        status +
        ' Angka, token dan masa berlaku ada pada kartu. Quote bersifat indikatif dan dapat kedaluwarsa; minta quote baru sebelum mengambil keputusan. Biaya gas tambahan, approval dan bridge yang belum tercakup bukan biaya nol. Tidak ada eksekusi swap.' +
        (d.request.comparisonScope === 'HYPOTHETICAL_CHAINS'
          ? ' Perbandingan hipotetis ini mengasumsikan aset sudah ada di masing-masing chain; biaya perpindahan antar-chain tidak dihitung.'
          : ' Perhatikan chain asal dan batas cakupan perbandingan pada kartu.')
      );
    }
    case 'getListing': {
      const p = validateData('api.ListingResponse', raw);
      if (!p.success) return null;
      const { listing, position } = p.data.data;
      const price = formatUnits(
        BigInt(listing.priceAtomic),
        listing.paymentToken.decimals,
      );
      const share = formatUnits(BigInt(position.incomeBps), 2);
      // Token symbols are registry data, never Markdown instructions.
      const symbol = listing.paymentToken.symbol.replace(/[\\`[\]<>]/g, '');
      return `Listing #${listing.listingId} · ${listing.displayStatus}. Harga hak pendapatan: ${price} ${symbol}. Bagian pendapatan: ${share}% (bukan APY).\n\nPembeli menerima hak pendapatan sesuai jangka waktu listing, bukan aset pokok. Status dan harga perlu diperiksa kembali sebelum konfirmasi wallet. [Lihat penawaran](${liveListingHref(listing.listingKey)}).`;
    }
    case 'getPosition': {
      const p = validateData('api.PositionResponse', raw);
      if (!p.success) return null;
      const position = p.data.data;
      const share = formatUnits(BigInt(position.incomeBps), 2);
      return `Posisi #${position.positionId} · ${position.displayState}. Bagian pendapatan: ${share}% (bukan APY).\n\nPemilik aset pokok: \`${position.principalOwner}\`.\nPemilik hak pendapatan: ${position.rightsOwner ? `\`${position.rightsOwner}\`` : 'belum ada'}.\n\nPosisi adalah hak pendapatan yang terpisah dari token backing. Penjualan kembali memindahkan sisa hak sampai tenggat semula; klaim yang sudah diperoleh tidak ikut berpindah. Data posisi ini berasal dari snapshot onchain.${position.activeListingKey ? ` [Lihat penawaran aktif](${liveListingHref(position.activeListingKey)}).` : ''}`;
    }
    case 'preparePurchase': {
      if (value.kind !== 'PURCHASE_PREVIEW') return null;
      const p = validateData('api.PreparedIntentResponse', value.payload);
      if (!p.success) return null;
      return (
        (p.data.data.state === 'BLOCKED'
          ? 'Preview belum dapat dilanjutkan; periksa penghalang pada kartu.'
          : 'Preview pembelian tersedia pada kartu. Buka listing dan buat review terbaru sebelum melanjutkan.') +
        ' Preview tidak menandatangani, menyetujui token, atau mengirim transaksi. Konfirmasi wallet tetap memerlukan klik kamu sendiri.'
      );
    }
    default:
      return null;
  }
}

/** Buffer prose until we know whether the run consulted tools. Never leak pre-tool claims. */
export class GroundedOutput {
  private prose: Event[] = [];
  private tools = new Map<string, string>();
  private results = new Set<string>();
  private explanations = new Set<string>();
  private usedTools = false;
  private flushed = false;
  constructor(private readonly runId: string) {}
  accept(event: Event): Event[] {
    const type = event.type;
    if (typeof type !== 'string') return [];
    if (type.startsWith('TEXT_MESSAGE_')) {
      if (!this.usedTools) this.prose.push(event);
      return [];
    }
    if (type === 'TOOL_CALL_START' && typeof event.toolCallId === 'string') {
      this.usedTools = true;
      this.prose = [];
      if (this.tools.has(event.toolCallId)) return [];
      this.tools.set(
        event.toolCallId,
        typeof event.toolCallName === 'string' ? event.toolCallName : '',
      );
      return [event];
    }
    if (type === 'TOOL_CALL_RESULT' && typeof event.toolCallId === 'string') {
      this.usedTools = true;
      this.prose = [];
      if (this.results.has(event.toolCallId)) return [];
      this.results.add(event.toolCallId);
      let raw: unknown;
      try {
        raw =
          typeof event.content === 'string'
            ? JSON.parse(event.content)
            : event.content;
      } catch {
        raw = null;
      }
      const narrative = toolNarrative(
        this.tools.get(event.toolCallId) ?? '',
        raw,
      );
      this.explanations.add(narrative ?? unavailable);
      if (narrative) return [event];
      // An invalid result must not enter cards, persistence, or later model context.
      return [
        {
          ...event,
          content: JSON.stringify({
            schemaVersion: '1.0',
            requestId: this.runId,
            error: {
              code: 'INVALID_TOOL_RESULT',
              message: unavailable,
              retryable: true,
              retryAfterSeconds: null,
              details: [],
            },
          }),
        },
      ];
    }
    if (type === 'RUN_STARTED' || type === 'RUN_FINISHED')
      return [{ type, threadId: event.threadId, runId: event.runId }];
    if (
      type === 'TOOL_CALL_ARGS' ||
      type === 'TOOL_CALL_END' ||
      type === 'RUN_ERROR'
    )
      return [event];
    // Provider snapshots, raw events and custom/debug channels cannot bypass narration.
    return [];
  }
  finish(completed: boolean): Event[] {
    if (this.flushed) return [];
    this.flushed = true;
    if (!this.usedTools) return completed ? this.prose : [];
    const text =
      ([...this.explanations].join('\n\n') ||
        'Permintaan berakhir sebelum data selesai diverifikasi. Belum ada hasil yang dapat digunakan.') +
      (!completed
        ? '\n\nPermintaan terhenti; hanya hasil yang sudah diverifikasi ditampilkan.'
        : '');
    const messageId = `grounded-${this.runId}`;
    return [
      { type: 'TEXT_MESSAGE_START', messageId, role: 'assistant' },
      { type: 'TEXT_MESSAGE_CONTENT', messageId, delta: text },
      { type: 'TEXT_MESSAGE_END', messageId },
    ];
  }
}
