# Accounting, event ordering, dan finalisasi

Status: spesifikasi v1, diperbarui 9 Oktober 2026. Implementasi core dan ABI terkompilasi sudah ada dengan bukti tes lokal di core-verification.md. Belum deployment Sepolia atau audit keamanan untuk dana nyata. Kewenangan finalisasi backend tim telah disetujui Wildan untuk hackathon. Aturan perilaku normatif ada pada change OpenSpec `build-rwa-income-rights`; dokumen ini menetapkan rumus dan keputusan desain yang harus dipakai semua implementasi.

## 1. Batas ekonomi

- Penjual pokok menjual `incomeBps` dari pendapatan backing selama `[startAt, endAt)`. Pembayaran harga tetap langsung kepada penjual pada pembelian; bukan deposit yang dikembalikan saat maturity.
- Penjualan ulang memindahkan seluruh hak untuk sisa periode. `principalOwner`, `incomeBps`, dan `endAt` tidak berubah. Klaim lama tidak berpindah.
- Payout menggunakan token aset itu sendiri. Klaim menyimpan **internal shares token**, bukan USDC, harga dolar, NFT, atau saham emiten baru.
- Platform fee demo adalah **0**. Gas tetap dibayar pengguna. Tidak ada automatic swap, bridge, auto-compound strategy, atau yield guarantee.
- Tiga aset demo memakai perilaku mekanisme yang sama dengan konfigurasi terpisah. Aset tidak boleh bercampur dalam ledger/cadangan. Nama demo bukan klaim backing saham asli.

## 2. Unit yang tidak boleh tertukar

| Nama | Unit | Aturan |
| --- | --- | --- |
| `tokenAmountAtomic` | ERC-20 smallest units | Tampilan dibagi `10^tokenDecimals`; token backing demo 18 decimals |
| `principalShares`, `claimShares` | Internal share units | Integer `uint256`, bukan ERC-20 amount; tidak memakai JS Number |
| `multiplier` | Fixed point 1e18 | `displayedTokenAmount = floor(shares × multiplier / 1e18)` |
| `priceAtomic` | Settlement-token smallest units | DemoUSD 6 decimals; 90 DemoUSD = `90000000` |
| `incomeBps` | Basis points | 1–10000, 5000 berarti 50%; 0 ditolak |
| `durationSeconds` | Detik | 60–31536000; default UI 15552000 = 180 hari, bukan enam bulan kalender |
| `*At`, `finalizedThrough` | Unix UTC seconds | Integer, timezone hanya presentasi |
| `eventCursor` | Sequence lokal registry per aset | Sequence 1-based, 0 baseline; tidak sama dengan nonce issuer |

Perkalian dan pembagian menggunakan operasi presisi penuh setara `mulDiv`. Pembulatan harus eksplisit. API membawa semua `uint256` sebagai string desimal; jangan konversi nominal melalui floating point.

## 3. Ledger dan konservasi

Satu aset memiliki `totalPrincipalShares` dan `totalClaimShares`. Setiap posisi mempunyai `principalShares`; klaim diakumulasi pada `(assetId, beneficiary)`, termasuk dari banyak posisi. Event alokasi tetap mencatat `positionId` untuk audit.

```text
L(asset) = totalPrincipalShares(asset) + totalClaimShares(asset)
L(asset) <= adapter.sharesOf(market)
unallocatedShares = adapter.sharesOf(market) - L(asset)
```

`unallocatedShares` berasal dari donasi/transfer langsung dan tidak otomatis menjadi dividen, backing, atau saldo admin. V1 tidak memiliki fungsi sweep. Tidak ada rebalancing cadangan antar-aset.

Deposit memakai transfer ERC-20 yang disetujui pengguna dan mengukur delta `sharesOf(market)` sebelum/sesudah. Catat delta nyata, pastikan positif dan `>= minReceivedShares`; adapter hanya mengizinkan mekanisme yang telah diuji, tanpa fee-on-transfer atau callback bebas. Deposit tidak mengklaim event sebelum baseline deposit: cursor awal sama dengan head event yang tersinkron. Perubahan karena transfer/issuer callback yang membuat snapshot tidak sesuai menyebabkan seluruh transaksi revert.

Pada alokasi, shares berpindah secara pembukuan dari principal ke claim; **jumlah kewajiban shares tidak bertambah**. Pada claim/release, penurunan kewajiban sama persis dengan delta shares vault dan kenaikan shares penerima. Transfer nominal biasa bukan pengganti otomatis `transferShares`; penyimpangan dari jumlah shares diminta menyebabkan revert seluruh transaksi.

## 4. Dividen, split, dan pertumbuhan klaim

Untuk event DIVIDEND final dengan `M1 > M0 > 0`, backing shares sebelum event `S`:

```text
P = ceil(S × M0 / M1)
I = S - P
B = floor(I × incomeBps / 10000)       # hanya jika hak buyer eligible
A = I - B
principalShares = P
claimShares[rightsOwner] += B
claimShares[principalOwner] += A
```

Jika buyer tidak eligible, `B = 0`, `A = I`. Event sebelum aktivasi atau pada/setelah expiry memberi seluruh income kepada principal owner. Jika alamat principal owner sama dengan rights owner, dua alokasi dijumlahkan ke satu saldo; jangan double count total.

`ceil` mempertahankan principal token-equivalent sekurang-kurangnya nilai tepat sebelum dividen; residual kurang dari satu **share unit** tetap di principal. Klaim buyer dibulatkan ke bawah; sisa share pembagian menjadi klaim principal owner. Ini bukan jaminan nilai dolar, bukan perlindungan dari split/fee/aksi issuer, dan bukan klaim batas satu token atom pada multiplier ekstrem. `I = 0` sah untuk deposit sangat kecil; cursor tetap maju tanpa klaim fiktif.

SPLIT (`M1 > M0`) dan REVERSE_SPLIT (`0 < M1 < M0`) mengubah jumlah token yang ditampilkan, **tanpa memindahkan shares ke income**. NO_INCOME hanya untuk perubahan nonce yang terbukti tidak mengubah multiplier dan bukan corporate action unsupported. DIVIDEND dengan multiplier turun/sama tidak didukung; jangan menyebutnya dividen negatif.

Klaim yang sudah dialokasikan tidak diproses ulang sebagai backing. Shares klaim tetap milik penerimanya, sehingga nilai tokennya mengikuti multiplier berikutnya, termasuk setelah resale/expiry. `claimIncome` boleh mengambil sebagian/seluruh shares final tanpa memproses backlog posisi. Klaim dari event yang belum dialokasikan belum termasuk `claimShares`; UI harus membedakan `allocated` dan `pendingAccounting`.

## 5. Fixture numerik normatif

Semua angka hipotetis. `Q=1e18`, awal `S=100000000000000000000`, `M0=1000000000000000000`, `incomeBps=5000`. Harga 90 DemoUSD tidak ikut rumus.

| Setelah event | Principal shares | Alice claim shares | Bob claim shares | Carol claim shares |
| --- | ---: | ---: | ---: | ---: |
| +2%, `M1=1020000000000000000` | 98039215686274509804 | 980392156862745098 | 980392156862745098 | 0 |
| Bob resale ke Carol, tidak ada event baru | 98039215686274509804 | 980392156862745098 | 980392156862745098 | 0 |
| +2% berikutnya, `M2=1040400000000000000` | 96116878123798539024 | 1941560938100730488 | 980392156862745098 | 961168781237985390 |

Jumlah keempat kolom selalu `100000000000000000000` shares. Setelah event kedua, floor token atoms: principal `100000000000000000000`; Alice `2019999999999999999`; Bob `1019999999999999999`; Carol `999999999999999999`. Tampilan sekitar 100, 2.02, 1.02, dan 1 token; selisih atom tampilan bukan hilangnya shares.

Fixture kecil untuk rounding: `S=3`, `M0=100`, `M1=200`, `f=5000` menghasilkan `P=2`, `I=1`, `B=0`, `A=1`. `S=1` dengan multiplier yang sama menghasilkan `P=1`, `I=0`. Uji 100% dengan `f=10000` menghasilkan `B=I`, `A=0`.

Jika seluruh shares pada baris terakhir mengalami split 2:1 (`M3=2080800000000000000`), semua kolom shares tetap sama, token-equivalent berlipat dua, dan tidak ada event `IncomeAllocated` nonzero. Transfer langsung 10 shares ke vault hanya menambah unallocated; tidak mengubah empat kolom.

## 6. Event dan urutan kepemilikan

Event registry final berurutan per aset, memiliki `sequence`, `eventId`, `effectiveAt`, `kind`, multiplier before/after, issuer nonce after, dan evidence hash. `eventId` menyatukan chain/token/source occurrence; versi koreksi **tidak** menciptakan occurrence baru. Pending schedule tidak masuk income ledger. Override schedule yang belum efektif mengganti observasi pending, bukan menambah dividen.

Urutan primary:

1. Deposit/listing mencatat baseline cursor dan shares yang benar-benar diterima.
2. Sebelum buy, pastikan head registry cocok dengan state token yang hidup, lalu checkpoint sampai head.
3. Income selama offered menjadi milik Alice.
4. Catat `startAt = block.timestamp`, `endAt = startAt + durationSeconds`, `activationEventCursor = eventCursor`, `rightsOwner = buyer`.

Event buyer eligible bila `sequence > activationEventCursor` dan `startAt <= effectiveAt < endAt`. Pada detik yang sama, event yang sudah diproses sebelum pembelian tetap milik Alice. Event baru yang benar-benar efektif sesudah pembelian dalam detik yang sama mempunyai sequence lebih tinggi dan eligible. EVM transaction order dan cursor memutus ambiguitas detik; metadata tidak boleh mengubah urutan yang telah ditutup.

Sebelum resale, checkpoint semua event sampai head **di bawah owner lama**, baru ubah owner. Tidak perlu array semua pemilik untuk accounting jika guard ini dipenuhi; event transfer menyimpan owner lama/baru dan cursor untuk audit. Jika token sudah berubah tetapi event belum dikenal, resale revert; frontend menyembunyikan tombol saja tidak cukup.

Contoh: event efektif 10:00, metadata masuk 10:05, Bob ingin resale 10:03. Fingerprint mismatch mencegah resale. Pada 10:05 checkpoint mengalokasikan kepada Bob; resale kemudian hanya memindahkan income masa berikutnya. Jika event 11:59 diketahui setelah expiry 12:00, tetap eligible; event tepat 12:00 tidak eligible.

## 7. Snapshot, coverage, dan batas kepercayaan

Ada **dua guard berbeda**:

1. **Synchronized head:** current multiplier/nonce, pending schedule, history identity, dan observable config cocok dengan snapshot registry yang sudah diperiksa. Dipakai untuk deposit, relist, primary buy, secondary create/buy, settle, dan release.
2. **Coverage watermark `finalizedThrough`:** updater menyatakan seluruh kejadian efektif sampai waktu itu sudah diperiksa sejak baseline, termasuk memastikan tidak ada event yang hilang. Dipakai untuk menutup kewajiban sebelum melepaskan principal.

Updater membaca blok dengan finalitas blockchain, merekonsiliasi API issuer + logs/history sejak baseline, lalu mengirim event, mengakui snapshot, dan memajukan coverage. API `Initial`/`Corrected` bukan jaminan finalitas issuer. Hash evidence memungkinkan audit payload; tidak membuktikan kebenaran metadata dengan sendirinya.

Snapshot observable minimal: resolved multiplier/issuer nonce, pending multiplier/nonce/activation time, history length + latest-entry hash, feePerPeriod, periodLength, token runtime codehash. Gunakan `getCurrentMultiplier()` pada adapter, bukan berasumsi getter sederhana sudah memasukkan fee. Fee harus 0 untuk adapter v1; pending yang telah efektif namun belum ada event final membuat guard gagal. Future pending yang sudah direkonsiliasi boleh disimpan tanpa membagikan income.

Proxy runtime codehash **tidak** membuktikan implementation proxy tidak berubah. Monitor updater wajib memeriksa implementation slot secara offchain, menyimpan identitas dalam evidence, dan quarantine jika berbeda dari konfigurasi yang ditinjau. Tidak ada klaim kontrak lain dapat langsung membaca storage privat proxy atau memverifikasi issuer HTTP.

Coverage monotonik, tidak melebihi timestamp blok sumber final yang diamati, dan harus lebih kecil dari `block.timestamp` transaksi coverage. Coverage disertai source block number/hash dan hash evidence; finalitas/source completeness tetap pernyataan updater yang dipercaya. Event baru dengan `effectiveAt <= finalizedThrough` ditolak, demikian pula edit event final. Jika koreksi mengubah rentang yang sudah ditutup, **quarantine dan catat insiden**, bukan sisipkan event ke belakang.

Buy/resale tidak mensyaratkan watermark sama dengan detik transaksi, karena keeper tidak bisa menutup setiap detik sebelum transaksi itu terjadi. Guard live memastikan tidak ada transisi observable yang belum direkonsiliasi. Ini tetap bergantung pada kelengkapan adapter dan kejujuran finalizer; retroactive issuer correction atau upgrade yang belum terdeteksi bukan masalah yang diselesaikan oleh watermark.

## 8. Settlement, cancellation, dan release

- Pada `now >= endAt`, hak tidak lagi dijual. `SETTLING` adalah tampilan untuk posisi ACTIVE yang sudah expired; waktu berlalu sendiri tidak menulis storage atau mengirim token.
- `settlePosition` memerlukan `finalizedThrough >= endAt`, live head synchronized, dan checkpoint selesai sampai head. Ia menandai SETTLED; tidak mengirim principal dan tidak menghapus klaim.
- `releasePrincipal` oleh principal owner, untuk SETTLED, memeriksa live head kembali dan checkpoint event baru pasca-expiry. Semua income baru backing masuk Alice. Transfer hanya `principalShares`; klaim seluruh alamat tetap dicadangkan.
- Primary cancellation boleh menutup listing ketika data stale; simpan `cancelledAt`. Posisi CANCELLED tidak dapat dibeli/relist. Release terpisah menunggu coverage `>= cancelledAt`, live head synchronized, dan checkpoint. Semua income backing sebelum dilepas menjadi milik Alice. Tidak ada `endAt` palsu pada posisi yang belum aktif.
- Penawaran primary yang hanya expired tetap OFFERED. Seller dapat relist dengan ID listing baru sambil menjaga backing, atau cancel lalu release. Relist hanya mengubah harga/deadline; perubahan incomeBps/duration/deposit memerlukan posisi baru.
- Secondary cancellation tidak membatalkan hak dan boleh dilakukan saat data stale. Principal tidak pernah dapat dilepas saat hak aktif.
- Setelah release, state RELEASED dan principalShares=0. Getter menyimpan historical owner/terms; saldo klaim lintas posisi tetap ada. Tidak ada admin override penarikan atau clawback.

Tidak ada batas tunggu 24 jam atau janji waktu maksimum release saat sumber ambigu. Backend mati dapat menunda perdagangan/release. Ini tradeoff trust/liveness yang disetujui untuk hackathon, bukan finalitas trustless produksi.

## 9. Backlog dan isolasi kegagalan

`checkpointPosition(positionId,maxEvents)` permissionless; `1 <= maxEvents <= 32`. Panggilan memproses paling banyak batas tersebut, mengembalikan cursor dan apakah selesai. Retry dengan cursor terbaru tidak memproses event dua kali. Batch historis boleh diproses meskipun current head belum synchronized; hanya event final yang dikenal diproses.

Transaksi buy/release/settle boleh melakukan checkpoint internal sampai 32 event. Bila backlog masih tersisa, **revert seluruh transaksi tersebut** dengan `CheckpointRequired`; pengguna/keeper harus memakai checkpoint terpisah untuk menyimpan kemajuan. Jangan berasumsi kemajuan checkpoint internal bertahan setelah revert.

Data stale/unsupported action membatasi operasi yang membutuhkan accounting mutakhir. Checkpoint prefix final boleh berjalan ketika `safetyState=NORMAL` tetapi head terbaru DATA_STALE; ia tidak membutuhkan event baru yang belum dikenal. **Explicit quarantine memblokir checkpoint juga**, agar koreksi yang diketahui terhadap record final tidak terus dialokasikan ke posisi lain. Cancel listing dan claim yang sudah dialokasikan tetap dapat berjalan jika share-transfer semantics masih terverifikasi. Untuk configuration/implementation mismatch yang dapat merusak transfer shares, claims juga diblokir dengan alasan khusus. Quarantine tidak otomatis mengubah pemilik, menghapus klaim, atau menutup aset lain.

Temporary quarantine tanpa `finalityConflict` tetap mengizinkan finalizer append event yang lolos validasi dan acknowledge head; hal ini memperbaiki metadata, bukan membuka transaksi ekonomi. Coverage/checkpoint/settlement/release tetap tertahan. Admin saja yang dapat kembali NORMAL setelah head synchronized dan share transfer aman. Konflik terhadap record final bersifat permanen pada deployment ini: append/resume ditolak, tanpa rewrite, reset atau sweep.

Adapter harus lulus qualification untuk riwayat **maju setelah baseline**. Array resmi yang diperiksa memang parsial untuk masa sebelum baseline; hal itu tidak membuktikan seluruh sequence mendatang aman diproses. Jika source baru memangkas/mengubah entry efektif, atau housekeeping tidak dapat dinormalisasi tanpa kehilangan identitas event, hentikan adapter dan laporkan qualification gagal. Tidak boleh menyatakan source snapshot sebelumnya sebagai tes fork produk yang sudah lulus.

Finality source block Sepolia dapat membuat waktu tunggu lebih panjang dari demo maturity 600 detik. Siapkan posisi/event Sepolia sebelumnya dan tampilkan timestamp/transaksi nyata; untuk satu lifecycle yang utuh gunakan rekaman eksekusi asli yang menjelaskan jeda. Demo lokal Anvil boleh memakai time travel dengan label lokal. Jangan melakukan `evm_warp`, mengklaim blok belum final sebagai finalized, atau menyamakan beberapa posisi staged sebagai satu lifecycle live di Sepolia.

## 10. Validasi yang harus dilakukan saat development

- Differential integer tests terhadap rumus independen dan fixture di atas; fuzz lintas percentage/amount/multiplier ekstrem.
- Stateful invariants: konservasi shares per aset, tidak ada negative claims/replay, tidak ada owner change tanpa payment, release tidak mengurangi cadangan klaim.
- Late event, same-second before/after buy, exact expiry, resale race, schedule override, nonce gap, matching multiplier but changed nonce, source correction before/after final coverage.
- Claim sesudah resale/expiry/release dan saat metadata event berikutnya stale; fail issuer pause/sanctions/implementation change dengan alasan berbeda.
- 32-event batch dan backlog lebih besar: bounded gas serta explicit separate-checkpoint recovery.
- Fork token resmi: perubahan saldo aktual, allowance/deposit, share transfer, pause/revert behavior. Pisahkan state asli dari event sintetis yang diinjeksikan pada fork.

Riset aritmetika awal lulus 5000 urutan Python. Implementasi kini mempunyai suite Foundry dan pinned fork tersendiri; lihat [core verification](../core-verification.md) dan [remediation audit](../presepolia-remediation.md) untuk bukti serta batas terbaru. Daftar acceptance di atas tidak dengan sendirinya menjadi hasil tes.

## Sumber primer

- [Backed implementation pada commit riset](https://github.com/backed-fi/backed-token-contract/blob/35859e8c755698eeeef96ef15beef5fcd6b978cc/contracts/BackedAutoFeeTokenImplementation.sol): pembacaan ulang 8 Oktober 2026 mengonfirmasi share conversion, resolved multiplier, schedule override, dan transfer shares. Rancangan protokol di atas adalah keputusan proyek sendiri.
- [xStocks multipliers](https://docs.xstocks.fi/developers/multipliers): konteks mekanisme issuer, bukan jaminan semua perubahan adalah dividen.
- [OpenZeppelin Math](https://docs.openzeppelin.com/contracts/5.x/api/utils): API full-precision arithmetic dan rounding.
- Bukti snapshot/source/aritmetika lokal: [`../../research/evidence-2026-10-08/README.md`](../../research/evidence-2026-10-08/README.md).
