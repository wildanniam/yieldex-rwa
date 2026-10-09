---
title: RWA Income Rights — Riset Teknis untuk OpenSpec
date: 2026-10-08
status: riset selesai; rekomendasi desain untuk review; implementasi belum dimulai
language: id
---

# Riset teknis untuk OpenSpec

Dokumen ini melengkapi [PRD](../docs/product.md). Keputusan produk yang sudah disetujui tetap berlaku. Rekomendasi di sini adalah rancangan kerja berdasarkan riset, bukan klaim bahwa kontrak produk sudah dibangun atau aman untuk dana nyata. Jobdesk menunggu meet; task dapat disusun tanpa assignee.

**Status terbaru:** pilihan finalizer metadata terbatas telah disetujui Wildan. Baseline interface/desain lengkap sekarang berada di [OpenSpec](../openspec/changes/build-rwa-income-rights/design.md) dan [keputusan aktif](../docs/spec/decisions.md). Laporan ini mempertahankan bukti riset dan pertimbangan awal; jika nama/status antarmuka berbeda, baseline OpenSpec terbaru menjadi acuan.

## 1. Hasil utama

**Konsep bisa diteruskan dengan arsitektur yang terjangkau untuk hackathon:** ledger hak onchain, satu mekanisme adapter untuk beberapa token, accounting berbasis unit internal token, pencatatan event berurutan, dan AI dengan tool terbatas. Bagian sulit yang harus dikerjakan dengan benar adalah corporate action dan finalisasi, bukan NFT.

Rekomendasi dasar penyusunan spec:

| Area | Rekomendasi | Status bukti |
| --- | --- | --- |
| Provider pertama | xStocks EVM langsung, tanpa wrapper pada vault kita | API, source terverifikasi, state dan simulasi eth_call diperiksa; fork produk belum ada |
| Kandidat aset | SPYx, AAPLx, MSFTx; SPYx menjadi alur pertama | Ketiganya memakai implementasi yang sama pada blok riset |
| Demo | Mock berperilaku rebase/split di Sepolia; label DemoSPY/DemoAAPL/DemoMSFT | Desain; belum deployment |
| Accounting | Pisahkan backing dan payout menggunakan internal shares | Aritmetika eksploratif diperiksa; belum tes Solidity |
| Perdagangan | Ledger posisi; pembelian/resale utuh dan pembayaran atomik | Keputusan produk disetujui; belum implementasi |
| Event | Registry event per aset; proses berurutan sebelum perubahan kepemilikan/pokok | Rekomendasi desain |
| Finalisasi | Satu updater tim memeriksa dan menyatakan event final; tutup jalur yang bergantung pada data yang belum jelas | Usulan core utama; batas trust dijelaskan di bagian 5 |
| Pembayaran | DemoUSD untuk pembelian hak; rekomendasi quote read-only mainnet tanpa eksekusi swap/bridge | Scope dikoreksi Wildan; quote live produk belum diuji |
| AI | Responses API + fungsi pencarian, penjelasan, quote, dan preview tervalidasi | Dokumentasi resmi diperiksa; API runtime belum dicoba |

Pemilihan xStocks adalah rekomendasi teknis untuk adapter pertama berdasarkan kecocokan dengan payout in-kind. Ini tidak membatasi desain selamanya ke satu provider. Aset lain hanya boleh masuk allowlist setelah kompatibilitasnya terbukti.

## 2. Bukti yang diperoleh

Pemeriksaan dilakukan 8 Oktober 2026. Semua panggilan blockchain bersifat read-only; tidak memakai private key, membeli token, atau mengirim transaksi. Data berubah dari waktu ke waktu, sehingga identitas chain, alamat, blok dan hash menjadi bagian bukti.

### Ethereum: tiga aset resmi

Blok `26145883`, hash `0xaf43d16d79770a96dbe621e0ae711cabb98319b5fa1a260ea22080947b48fb0a`, diperoleh melalui tag `finalized` RPC. Dua belas request API publik untuk metadata, multiplier, history, dan corporate actions tiga aset berhasil.

| Aset | Alamat Ethereum dari API issuer | Decimals | Multiplier integer / 1e18 | Nonce | Riwayat API / array kontrak |
| --- | --- | --- | --- | --- | --- |
| SPYx | `0x90a2a4c76b5d8c0bc892a69ea28aa775a8f2dd48` | 18 | `1005714560286254000` | 4 | 4 / 1 |
| AAPLx | `0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a` | 18 | `1003269012539818700` | 5 | 5 / 2 |
| MSFTx | `0x5621737f42dae558b81269fcb9e9e70c19aa6b35` | 18 | `1005903390478745600` | 5 | 5 / 2 |

Semua `feePerPeriod()` bernilai 0 dan `periodLength()` bernilai 604800 pada snapshot. Itu kondisi snapshot, bukan janji konfigurasi issuer tidak akan berubah. Array kontrak berisi genesis dan, untuk AAPLx/MSFTx, satu event terbaru; jangan menganggap seluruh riwayat API tersedia onchain.

Slot implementasi ketiga proxy menunjuk `0x65c40d624af3b18c109fbf87b7deff34cdc5f19b`. Sourcify melaporkan exact match untuk creation/runtime, dan bytecode yang dibaca langsung dari RPC pada blok tersebut cocok dengan bytecode Sourcify. Source utama juga sama, setelah normalisasi newline, dengan repository Backed commit `35859e8c755698eeeef96ef15beef5fcd6b978cc`. Source mengandung `sharesOf`, `transferShares`, history multiplier, fee, pause, dan pemeriksaan sanctions. Ini memperkuat bukti kesesuaian source; bukan audit keamanan.

Simulasi `eth_call transferShares` terhadap ketiga token, memakai alamat wrapper publik issuer yang memiliki saldo, mengembalikan `true` untuk `10^15` share units. Simulasi ini tidak memindahkan saldo secara permanen dan belum membuktikan deposit → accounting → claim produk kita.

Sumber data: [SPYx](https://api.xstocks.fi/api/v2/public/assets/SPYx), [AAPLx](https://api.xstocks.fi/api/v2/public/assets/AAPLx), [MSFTx](https://api.xstocks.fi/api/v2/public/assets/MSFTx), [source terverifikasi Sourcify](https://sourcify.dev/server/v2/contract/1/0x65c40d624af3b18c109fbf87b7deff34cdc5f19b?fields=all), [source Backed pada commit riset](https://github.com/backed-fi/backed-token-contract/blob/35859e8c755698eeeef96ef15beef5fcd6b978cc/contracts/BackedAutoFeeTokenImplementation.sol).

### Batas dukungan provider

xStocks EVM menyesuaikan saldo token melalui multiplier; dividen dan split sama-sama dapat mengubah multiplier. [Dokumentasi mekanisme](https://docs.xstocks.fi/developers/multipliers). Ondo menjelaskan dividen yang direinvestasikan tercermin pada pricing; ini memerlukan adapter ekonomi berbeda. [Dokumentasi Ondo](https://docs.ondo.finance/ondo-stocks/corporate-actions).

Karena vault kita memang dirancang memahami rebase, usulan paling langsung adalah menerima underlying xStocks. Wrapper menambah langkah dan aturan conversion; dokumentasinya juga membedakan versi. Jangan memasukkan token backing rebasing langsung ke pool Uniswap v3 untuk demo swap. Usulan pool pembayaran demo ini historis; revisi scope bagian 7 menghapus kebutuhan membangun pool. [Dokumentasi wrapper](https://docs.xstocks.fi/developers/wrapped-xstocks).

Sepolia tidak muncul sebagai deployment pada metadata tiga aset yang diperiksa. Riset ini belum menemukan faucet/testnet resmi xStocks yang bisa dijadikan dependensi. Itu alasan konkret memakai mock di Sepolia dan fork token resmi di Ethereum. Akses mint/redeem issuer memerlukan onboarding; demo kita tidak perlu mengakses jalur itu. [Issuer issuance/redemption](https://docs.xstocks.fi/docs/issuance-and-redemption).

## 3. Accounting yang direkomendasikan

### Pisahkan tiga hal

1. **Backing pokok posisi:** bagian aset yang menghasilkan pendapatan selama perjanjian.
2. **Saldo klaim setiap penerima:** payout yang sudah dialokasikan dan menjadi milik alamat tersebut.
3. **Token masuk tanpa deposit resmi:** tidak otomatis menjadi backing atau dividen, dan tidak menambah hak seseorang.

Simpan ketiganya dalam pembukuan yang tidak tercampur. Untuk xStocks, unit internal shares cocok untuk menjaga kepemilikan saat jumlah token tampak berubah. Istilah shares di sini adalah unit pembukuan kontrak token; bukan saham baru atau NFT yang kita terbitkan.

### Rumus dasar — rekomendasi desain untuk diuji

Misalkan `S` adalah backing dalam internal shares sebelum event, `M0` multiplier sebelum dividen, `M1` sesudah dividen, dan `f` persentase pembeli dalam basis points, dengan 10000 = 100%.

Untuk **event dividen terverifikasi** dengan `M1 > M0`:

```text
retainedPrincipalShares = ceil(S × M0 / M1)
incomeShares            = S − retainedPrincipalShares
buyerIncomeShares       = floor(incomeShares × f / 10000)
sellerIncomeShares      = incomeShares − buyerIncomeShares
```

Dengan ini, nilai pokok dalam unit token sesaat sebelum/sesudah dividen dipertahankan hingga selisih pembulatan kecil. Sebagian shares dipindahkan secara pembukuan ke klaim; saldo fisik tetap berada di kontrak sampai diklaim. Rounding pembeli tidak boleh membuat kewajiban melampaui cadangan. `Math.mulDiv` dengan arah rounding eksplisit dapat dipakai untuk implementasi; intermediate perkalian biasa berisiko overflow. [OpenZeppelin Math](https://docs.openzeppelin.com/contracts/5.x/api/utils).

Aturan lain:

- **Split/reverse split:** jumlah internal shares pemilik tidak berubah; nilai tampilan pokok dan klaim menyesuaikan. Tidak mencetak pendapatan baru.
- **Saldo klaim yang lama:** shares tetap milik penerimanya. Pertumbuhan selanjutnya tercermin otomatis melalui multiplier; jangan membaginya ulang sebagai pendapatan backing.
- **Sebelum posisi dibeli:** dividen backing menjadi milik Alice.
- **Setelah expiry:** dividen baru backing menjadi milik Alice; bagian Bob/Carol atas event lama tetap tersimpan.
- **Fee/penurunan multiplier:** tidak menjadi dividen negatif yang diam-diam ditagih ke buyer. Unit aset dapat menyusut karena issuer. Pilihan implementasi awal: hanya aktifkan adapter yang konfigurasi feenya telah dimodelkan; perubahan fee tak terduga membuat jalur yang bergantung padanya menunggu validasi. Jangan menjamin jumlah pokok kebal terhadap tindakan issuer.
- **Spin-off, merger, stock/cash combination, perubahan administratif:** jangan dipaksakan menjadi cash dividend. Tandai unsupported dan tahan tindakan yang dapat merusak pembukuan pada aset tersebut. Belum ada klaim dukungan otomatis untuk semua corporate actions.

Invariants utama:

```text
sum(backingShares) + sum(claimShares) <= sharesOf(vault)
```

Selisih hanya boleh berasal dari aset tak teralokasi yang terjelaskan. Pada alokasi dividen, jumlah shares total tidak bertambah. Pada klaim, pengurangan kewajiban harus sama dengan shares yang ditransfer. Deposit dicatat dari perubahan shares nyata sebelum/sesudah transfer, sehingga jumlah yang diminta tidak dianggap otomatis sama dengan jumlah yang diterima.

Gunakan transfer shares untuk payout jika adapter telah membuktikan perilakunya. Transfer ERC-20 nominal dapat membulatkan konversi ke shares, sehingga tidak cukup menghapus nominal klaim lalu berasumsi aset yang keluar persis sama. Fallback transfer nominal harus punya aturan selisih teruji.

### Contoh yang menjelaskan compounding

Contoh hipotetis dengan backing 100 token, hak 50%, dua dividen masing-masing +2%, tanpa split/fee:

| Tahap | Pokok Alice | Klaim Alice | Klaim Bob | Klaim Carol |
| --- | --- | --- | --- | --- |
| Dividen pertama | 100 | 1 | 1 | 0 |
| Bob menjual seluruh posisi kepada Carol | 100 | 1 | 1 | 0 |
| Dividen kedua | 100 | 2,02 | 1,02 | 1 |

Total 104,04 token. Tambahan 0,02 milik Bob berasal dari pertumbuhan 1 token payout yang sudah menjadi miliknya. Carol mendapat 1 token dari backing 100 token. Tidak ada perpindahan klaim lama Bob kepada Carol.

### Pemeriksaan aritmetika yang sudah dilakukan

Eksperimen Python integer/Fraction: 5000 urutan × 20 langkah, seed `20261008`, mencakup 85000 transisi dividen plus split/reverse split dan pengambilan klaim. Pemeriksaan konservasi shares lolos; kelebihan rounding pokok < 1 share unit/event, selisih buyer dari pembagian ideal < 2 share units/event pada sampel. Contoh tabel diperiksa dengan pecahan eksak.

Ini pemeriksaan rumus, **bukan** tes kontrak, otorisasi, finalisasi, gas, atau integrasi issuer. Batas rounding juga perlu dibuktikan dan diuji di Solidity, terutama untuk nominal kecil, nilai ekstrem, dan banyak event. Hasil tersimpan di `research/evidence-2026-10-08/arithmetic-results.json`.

## 4. Urutan event dan jual ulang

Usulan untuk mengurangi kompleksitas: simpan event terverifikasi berurutan per aset, lalu setiap posisi mempunyai cursor event terakhir yang sudah diproses. Tidak perlu memproses semua posisi dalam satu transaksi keeper.

Sebelum pembelian, resale, atau penarikan backing, kontrak memastikan posisi telah memproses event yang relevan dan state multiplier/nonce saat ini cocok dengan rangkaian yang telah dikenali. Jika token sudah berubah tetapi klasifikasi belum tersedia, operasi tersebut harus menunggu. UI menunjukkan alasan konkret, bukan kegagalan generik.

Ini penting untuk contoh: dividen efektif pukul 10.00, layanan membacanya 10.05. Bob tidak boleh berhasil menjual pada 10.03 dengan accounting lama lalu pendapatan pukul 10.00 diberikan kepada Carol. Guard kontrak harus berlaku walaupun pengguna memanggil kontrak langsung.

Detail yang harus ditulis dalam spec:

- Start posisi mencatat timestamp **dan cursor event aktivasi**. Event yang telah diproses sebelum pembelian tidak menjadi hak buyer walaupun berada pada detik yang sama.
- Jual ulang melakukan checkpoint lebih dahulu; event yang sudah berlaku pada perubahan kepemilikan dialokasikan kepada pemilik sebelumnya. Carol hanya menerima event selanjutnya.
- Pada expiry, event dengan waktu efektif `>= endAt` tidak menjadi hak buyer. Event valid sebelum expiry boleh diproses setelahnya, dengan pemilik yang benar.
- Pending schedule belum menghasilkan klaim. Jadwal pending dapat diganti; data yang diganti tidak boleh diproses dua kali.
- Gunakan event identity yang mencakup chain/token/identitas sumber; versi baru bukan dividen baru. Nonce issuer tidak boleh diasumsikan selalu naik tepat satu.
- Mulai dari baseline onchain saat asset didaftarkan. Tidak perlu merekonstruksi hak sebelum vault menerima deposit. Riwayat sebelum baseline hanya untuk penjelasan historis.
- History array memberi bukti perubahan angka/waktu, tetapi tidak membuktikan apakah penyebabnya dividen atau split. Klasifikasi masih memerlukan updater yang dipercaya.
- Proses backlog dalam batch terbatas dan permissionless setelah event tersedia. Cursor maju setelah berhasil; retry tidak membayar ulang. Batas batch ditentukan dengan tes gas.
- Cancel listing resale dapat tetap diizinkan saat data stale karena tidak memindahkan backing/owner. Cancel primary boleh menutup penawaran, tetapi pengambilan backing tetap menunggu accounting aman.

Rangkaian multiplier saja tidak cukup membuktikan semua event lengkap: beberapa perubahan dapat saling meniadakan, nonce bisa melompat, dan provider dapat mengganti implementasi. Periksa riwayat sejak baseline serta perubahan konfigurasi. Bytecode hash proxy tidak mendeteksi perubahan implementation; pemantauan implementasi issuer tetap perlu dilakukan updater.

## 5. Finalisasi, koreksi, dan batas kepercayaan

OpenAPI issuer yang dibaca ulang memuat status `Initial`, `Corrected`, `Cancelled`, dan `Scheduled`; tidak ada status `Final`. Versi 2 pada contoh nyata tetap berstatus `Initial`. Jadi `version == 2` atau menunggu 24 jam bukan bukti bahwa issuer tidak akan mengoreksi lagi. Riset ini tidak menemukan jaminan batas waktu koreksi pada sumber yang diperiksa. [OpenAPI issuer](https://docs.xstocks.fi/_bundle/apis/@v2/openapi.json?download=).

**Pertanyaan core sudah disampaikan:** bolehkah layanan tim juga dipercaya menyatakan data final setelah pemeriksaan, dengan penundaan transaksi terkait dan tanpa kemampuan menarik kembali payout yang sudah dikirim? Wildan menjawab ingin cara simple tetapi tetap bagus. Saat riset awal respons itu belum merupakan persetujuan eksplisit. Sesudah penjelasan backend/token simulasi, Wildan menyatakan acc dan memberi mandat menulis spec; finalizer terbatas kini diterima untuk hackathon dengan batas kepercayaan tersebut.

**Dipilih setelah persetujuan terbaru Wildan:** gunakan satu layanan updater tim, dengan finalisasi protokol yang dinyatakan secara transparan. Tidak membangun voting/sistem sengketa tambahan untuk hackathon.

Alur yang direkomendasikan:

1. Layanan membaca metadata issuer, perubahan multiplier aktual, dan chain history dari blok yang sudah final.
2. Cocokkan token/chain, angka integer, waktu aktivasi aktual, event type, status/version, dan kontinuitas sejak baseline. Metadata yang tidak lengkap ditahan.
3. Layanan mengirim record final protokol: identitas event, versi sumber, tipe, multiplier lama/baru, waktu efektif, bukti lokasi chain, dan hash payload sumber. Hash memberi jejak audit, bukan tanda tangan issuer atau bukti kebenaran.
4. Kontrak memeriksa semua hal yang dapat diverifikasinya: role, urutan, identitas unik, state/history token yang tersedia, tipe yang didukung, waktu telah berlaku, serta aturan alokasi. Angka dan penerima tidak boleh diisi bebas oleh updater.
5. Record yang sudah dipakai untuk alokasi tidak dapat ditulis ulang. Permissionless checkpoint memprosesnya untuk posisi, lalu saldo yang sah dapat diklaim.

Finalitas blockchain berbeda dari finalitas data issuer. Kontrak EVM juga tidak membaca HTTP atau menerima bukti blok lama hanya karena seseorang mengirim hash; bagian validasi offchain tetap trust-dependent dan harus diungkapkan.

**Koreksi setelah finalisasi:** tidak ada mekanisme otomatis mengambil kembali token yang sudah dibayarkan. Hentikan komit event berikutnya yang terkait jika ada konflik, rekam insiden, dan jangan menutup kerugian diam-diam dari pokok pengguna lain. Perlu prosedur penyelesaian terpisah sebelum penggunaan dana nyata. Klaim lama yang sudah teralokasi tidak boleh dialihkan kepada admin.

**Ketersediaan layanan:** rancangan ini dapat menunda transaksi bila sumber tidak bisa diverifikasi. Tidak menjanjikan batas waktu maksimum pengembalian pokok ketika sumber tetap ambigu. Menjamin deadline pasti dalam kondisi itu memerlukan kebijakan risiko/cadangan/penanggung kerugian baru; hal itu mengubah konsep ekonomi dan harus dibahas dahulu.

Jalur klaim shares yang sudah final dapat dirancang tetap berjalan tanpa menunggu klasifikasi event berikutnya, karena kepemilikan shares tersebut sudah jelas. Namun, transfer masih dapat gagal karena pause/sanctions/upgrade issuer. Implementasi harus membuktikan isolasi ini; jangan otomatis menutup semua klaim hanya karena indexer terlambat.

Untuk demo, simulator menyediakan urutan event dan data final yang diketahui. Itu membuktikan mekanisme protokol, bukan jaminan issuer produksi tidak akan merevisi.

## 6. Arsitektur yang disarankan

Satu monorepo, tiga area: aplikasi Next.js; kontrak Foundry; paket bersama untuk ABI, tipe dan schema. Satu worker Node dari repo yang sama menangani issuer polling dan indexing. Pemisahan proses membuat loop tetap berjalan tanpa tergantung halaman browser; tidak perlu banyak microservices.

| Komponen | Tanggung jawab |
| --- | --- |
| `IncomeRightsMarket` | Deposit, backing ledger, posisi, listing, pembayaran, checkpoint, claim dan release; satu sumber state keuangan |
| `CorporateActionRegistry` | Record event per aset dan urutannya; writer terbatas; event yang dikonsumsi immutable |
| Adapter/library | Membaca shares/multiplier/history token dan mengonversi unit; versi per asset config |
| Worker | Membaca issuer dan chain, memeriksa event, mengirim record memakai akun khusus terbatas, mengisi cache |
| Next.js server | API aplikasi, tool AI, quote dan preview; validasi input dan session |
| Frontend/wallet | Menampilkan terms, request approval, tanda tangan pengguna, pending/receipt/recovery |
| Supabase | Cache pencarian, sumber data dan riwayat chat; bukan pemilik kebenaran saldo |

Nama/jumlah kontrak adalah rekomendasi; jangan memecah modul menjadi banyak kontrak bila menambah otorisasi dan sinkronisasi tanpa manfaat. Tidak menggunakan proxy upgrade untuk kontrak produk awal. Role updater berbeda dari kredensial AI dan hanya bisa menulis record dalam aturan kontrak. Admin tidak diberi setter saldo/owner/penerima atau fungsi sweep backing/claims. Perubahan adapter untuk posisi aktif tidak boleh diam-diam mengganti ekonominya.

State posisi cukup `Offered → Active → Settling → Settled`, dengan `Cancelled` untuk primary yang belum terjual. Expiry dihitung dari waktu; status Settling menunjukkan periode selesai tetapi kewajiban belum final. Listing sekunder memiliki status/expiry sendiri. Satu posisi maksimal satu listing aktif. Terms dan version listing disertakan dalam preview untuk mencegah pembelian berdasarkan cache lama.

Sebelum menjual/beli, cek asset checkpoint, owner, listing aktif, expiry, expected price, allowance/balance dan chain. Pembayaran settlement dan perpindahan hak harus satu transaksi; tanda tangan approval ERC-20 dapat memerlukan transaksi pendahuluan. Gunakan checks-effects-interactions dan reentrancy guard; revert mengembalikan seluruh perubahan bila transfer gagal. [Kontrol akses OpenZeppelin](https://docs.openzeppelin.com/contracts/5.x/access-control).

Indexer memakai `(chainId, txHash, logIndex)` untuk deduplikasi beserta block number/hash untuk deteksi reorg. UI memisahkan transaksi terkirim, receipt sukses, dan finalitas. Refresh merekonsiliasi state langsung dari kontrak. Riwayat chat menggunakan session yang terautentikasi dan akses per pengguna; alamat wallet yang diketik/dihubungkan sendiri bukan bukti autentikasi sesi. Service key Supabase tetap di server. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 7. Pembayaran dan rekomendasi quote — revisi scope

**DISEPAKATI langsung Wildan, 8 Oktober:** aplikasi hanya membaca data, membandingkan dan merekomendasikan tempat/rute swap. Tidak mengeksekusi swap/bridge, meminta allowance/signature untuk swap, atau memegang dana swap. Pembelian hak tetap memakai token settlement yang tersedia di wallet, dengan approval/pembayaran kontrak marketplace sesuai alur core.

**Menggantikan usulan sebelumnya:** membuat pool pembayaran Uniswap Sepolia, memasok liquidity, serta mengintegrasikan SwapRouter02 tidak diperlukan. Pembacaan bytecode infrastruktur yang sudah dilakukan tetap bukti historis pada evidence JSON, bukan kewajiban build atau bukti swap produk. Keputusan ini tidak menghapus onchain backing, primary/secondary market, income/claim atau settlement.

**REKOMENDASI:** query nominal penuh melalui API quote aggregator (kandidat 0x getPrice) untuk chain yang didukung; Uniswap Quoter via eth_call adalah alternatif langsung untuk kumpulan pool terkurasi. API aggregator menyederhanakan pencarian rute/multi-pool; membaca reserve/slot0 saja tidak cukup untuk menghitung swap besar pada concentrated liquidity. Quoter mensimulasikan tanpa mengirim transaksi; tidak perlu membeli/memiliki 1.000 ETH untuk menanyakan skenario 1.000 ETH. Read-only mainnet dapat berjalan bersama marketplace Sepolia, dengan label lingkungan berbeda. Tidak menyajikan real USDC mainnet sebagai token pembayaran DemoUSD testnet.

**Input:** chain asal (atau mode perbandingan hipotetis), alamat token input/output, integer amount, tujuan akhir output. Native ETH/WETH, native USDC/bridged variants harus dipetakan eksplisit. Untuk chain berbeda, nominal sama hanya perbandingan lokal dengan asumsi saldo sudah tersedia di setiap chain. Rekomendasi perpindahan harus mengikutsertakan rute bridge nyata, fees, waktu dan tujuan akhir; jika belum tersedia, tampilkan biaya belum dihitung dan jangan beri predikat terbaik end-to-end. Default implementasi awal: rekomendasi actionable di chain asal, perbandingan chain lain sebagai informasi bersyarat. Dukungan chain/provider tepat belum dikunci.

**Output:** source/route, chain, token addresses/decimals, amountIn, quoted amountOut, estimasi biaya yang diketahui, price impact bila tersedia secara terverifikasi, timestamp/blok, status freshness dan keterbatasan. Pisahkan biaya embedded dari biaya tambahan agar tidak double count. Quoter gasEstimate bukan otomatis total biaya pengguna (approval/router/L2 data fees bisa berbeda); bila total tidak tersedia, jangan beri label net final. Ranking deterministik berdasarkan hasil bersih yang sebanding, tidak dari tebakan LLM. Rute aggregator mungkin terbagi ke beberapa pool; jangan melabelinya single-pool atau terbaik semua pasar. No-route/timeout/stale adalah unavailable, bukan quote nol atau angka buatan. Jangan menampilkan confidence persentase yang tidak dikalibrasi.

**Estimasi vs prediksi:** quote memasukkan efek ukuran order pada state kini. Perubahan pasar antara quote dan eksekusi mendatang tidak diketahui pasti. Tidak perlu training ML untuk menghitung quote sekarang; model slippage CEX lama belum tervalidasi untuk AMM ini. Slippage tolerance hanyalah batas pilihan/skenario, tanpa transaksi aplikasi tidak menegakkan batas itu di exchange eksternal.

**Bukti sesi revisi:** dokumentasi resmi saja; belum call quote live untuk 1.000 ETH, belum API key/provider spike, tidak ada swap/signature/pool setup. Provider memiliki ketentuan akses/rate limit/API key; 0x getPrice mendokumentasikan taker opsional. LI.FI menunjukkan estimasi cross-chain (from/to chain, amount, fee/gas, duration); sumber potensial jika kelak ingin perbandingan rute lengkap, bukan dependensi wajib sekarang.

Sumber: [Uniswap quoting](https://developers.uniswap.org/docs/sdks/v3/guides/swapping/quoting), [0x getPrice](https://docs.0x.org/api-reference/evm-ap-is/swap/allowanceholder-getprice), [LI.FI quote](https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer).

## 8. AI yang konkret dan mudah dibangun

Gunakan satu assistant dengan function calling ber-schema ketat. Kode aplikasi menjalankan tool dan memvalidasi hasil, sementara model menjelaskan kepada pengguna. Tidak diperlukan multi-agent atau agen yang memegang private key. [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling).

Usulan tool:

| Tool | Input pokok | Output terpercaya |
| --- | --- | --- |
| `searchListings` | aset, budget, rentang durasi | ID listing, terms, status, blok sumber |
| `getPosition` | positionId | owner, backing, persentase, waktu, claims, sync status |
| `getAssetContext` | assetId | event historis, harga beserta timestamp, sumber dan keterbatasan |
| `getPaymentQuotes` | chain asal/mode hipotetis, token/pasangan, nominal, tujuan akhir | estimasi read-only bersumber, biaya dan asumsi; tanpa swap calldata atau signing |
| `preparePurchase` | listingId dan pilihan pembayaran | intent/preview tervalidasi, bukan transaksi yang langsung dikirim |

Function schema memakai `strict: true`; server tetap memeriksa ID, chain, alamat, rentang dan ownership. Output valid secara schema belum berarti isi benar. Nominal keuangan berupa string integer dengan decimals eksplisit; BigInt untuk perhitungan. Target kontrak dan calldata dibentuk oleh kode allowlist dari intent, bukan teks model.

Layar konfirmasi menampilkan penerima, harga, persentase, waktu, backing, payout, biaya dan perubahan saldo yang diperkirakan. Pengguna menandatangani lewat wallet. Mengulang tool call tidak boleh mengulang transaksi. UI menerima `intentId` dan hash terms untuk korelasi; receipt onchain menjadi bukti eksekusi.

Pisahkan harga listing, harga token backing, sejarah dividen, dan proyeksi. Jika data net dividend tidak lengkap, tampilkan tidak tersedia atau skenario dengan asumsi eksplisit. Jangan mengubah kenaikan harga saham menjadi dividend yield atau mengarang APY. API notes/teks listing adalah data tak tepercaya; tidak boleh mengubah izin tool. Kegagalan model tidak boleh menghilangkan kemampuan membuka listing dan bertransaksi manual.

## 9. Paket OpenSpec yang siap direncanakan

Mulai dengan konteks bersama dan kamus unit/state, kemudian change kecil berdasarkan capability. `tasks.md` menyatakan dependensi dan acceptance criteria tanpa assignee sampai meet. Usulan urutan:

1. **Asset adapter dan event protocol:** baseline, whitelist, integer units, data final, unsupported actions dan matriks bukti provider.
2. **Backing dan primary market:** deposit/list/cancel/buy, terms dan pembayaran atomik.
3. **Income accounting dan claim:** shares, rounding, checkpoint, old claims, split, no double claim.
4. **Secondary market:** listing, resale utuh, owner/cursor boundary dan stale listing.
5. **Expiry dan release:** eligibility cutoff, backlog, reserve protection dan recovery state.
6. **Web/wallet/indexer:** status transaksi, refresh/reorg, balances dan explorer.
7. **AI dan payment routes:** tools, kartu rekomendasi quote read-only, preview pembelian hak dan fallback UI manual.
8. **Demo dan bukti integrasi:** tiga aset, fork, read-only mainnet quotes berlabel, lifecycle serta matriks regresi.

Urutan ini tidak mewajibkan menunggu seluruh kontrak selesai sebelum web/AI mulai: setelah interface disepakati, modul dapat dikerjakan dengan fixture berlabel lalu diuji bersama. Jangan menganggap fixture sebagai bukti integrasi.

Draft requirement dapat dimulai sekarang. Keputusan finalizer telah diterima; aturan finalisasi lengkap dan proof gates mengikuti baseline OpenSpec. Rounding, interface, sumber metadata, checkpoint dan safety guards perlu diselesaikan dalam design sebelum accounting diterapkan. `openspec/specs` tidak diisi seolah fitur sudah dibangun; rencana hidup pada change artifacts sampai implementasinya selesai. [OpenSpec quickstart](https://openspec.dev/docs/quickstart).

## 10. Verifikasi berikutnya dan status sebenarnya

| Pemeriksaan | Status sekarang | Kriteria berikutnya |
| --- | --- | --- |
| API dan state tiga aset | Lulus read-only pada snapshot | Fixture integer dan mapping event yang reproducible |
| Source implementasi vs chain | Lulus: bytecode cocok; source utama cocok | Pin seluruh dependency/source untuk fork saat development |
| `transferShares` token resmi | Lulus eth_call ketiganya | Fork memeriksa perubahan saldo aktual, approve/deposit/claim dan revert |
| Konservasi aritmetika | Lulus eksperimen 5000 urutan | Implementasi Solidity, fuzz/invariant, differential test terhadap model independen |
| Quote read-only | Dokumentasi diperiksa; integrasi live belum diuji | Nominal/token/chain, stale/no-route, fees, perbandingan bersyarat, tanpa signature/swap; bukti Uniswap Sepolia sebelumnya hanya historis |
| Core lifecycle | Belum diuji | Deposit → buy → dividend → resale → dividend → expiry → claim → release |
| Corporate actions | Belum diuji pada kontrak produk | Split/reverse, no income from donation, fee/config change, override schedule |
| Sumber terlambat/revisi | Belum diuji | Guard direct calls, backlog, same timestamp, correction before/after final commit |
| Race/otorisasi | Belum diuji | Dua buyer, stale seller, duplicate report/claim, insufficient allowance, reentrancy |
| Multi-asset | Belum diuji pada produk | Isolasi shares/claim/event dan satu aset gagal tidak mencampur aset lain |
| Finalisasi/release | Desain finalizer disetujui; implementasi belum diuji | Tidak menghabiskan reserve; expiry bukan finality; bounded work tanpa loop semua posisi |
| AI/wallet end-to-end | Belum diuji | Data stale, salah chain, prompt injection, cancel signature, API error, no route, double click |
| Cache/reorg/UI | Belum diuji | Receipt/refresh/replacement, replay event, rollback cache dan state authoritative |

Pada fork, pisahkan skenario state asli dari synthetic issuer event yang dipicu melalui impersonation/time manipulation. Catat blok dan commit produk yang diuji. Penggunaan fork tidak memerlukan membeli saham/token. Pengujian random tidak menggantikan perjalanan normal UI atau verifikasi perubahan saldo.

## 11. Bukti lokal dan batas hasil

Ringkasan bukti tersimpan di `research/evidence-2026-10-08/`: snapshot aset, pembacaan kontrak, hasil simulasi, source verification dan aritmetika. Hanya snapshot terpilih dan sintesis yang disertakan dalam repo; script sementara serta respons mentah lengkap tidak tersedia dalam paket ini.

Beberapa endpoint web/RPC sempat gagal: sandbox DNS memerlukan izin jaringan baca; Sourcify path legacy 404, sedangkan API v2 berhasil; PublicNode kadang 403 dan pemeriksaan bytecode dilengkapi melalui dRPC. Kegagalan tooling tersebut tidak disembunyikan dan tidak dianggap kegagalan token. Tidak ada install OpenSpec, dependency produk, deployment, transaksi wallet, coding smart contract, GitHub issue/PR, atau pengujian fork produk pada sesi riset ini. Pernyataan ini merekam sesi riset sebelum starter dibuat; status implementasi terbaru ada di [README](../README.md).
