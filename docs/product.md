---
title: RWA Income Rights — PRD dan Konteks Bersama Tim
date: 2026-10-07
status: baseline produk disetujui; integrasi runtime belum diimplementasikan
language: id
---

# RWA Income Rights

Dokumen pegangan untuk empat anggota tim Ethereum Jakarta Hackathon 2026 dan AI yang membantu mereka. Nama di atas adalah nama kerja, belum menjadi branding final.

**Pembaruan baseline OpenSpec 8 Oktober:** Wildan telah menyetujui finalizer metadata terbatas dan mendelegasikan detail teknis. Acuan implementasi terbaru adalah [keputusan aktif](../docs/spec/decisions.md), [OpenSpec](../openspec/changes/build-rwa-income-rights/proposal.md), serta schema/interface bersama. Tampilan visual mengikuti desainer tim.

Dokumen ini menyatukan konsep produk, keputusan yang disetujui, kebutuhan fitur, arah teknis, rencana demo, dan kriteria pengujian. Starter monorepo tersedia; fitur produk belum diimplementasikan. Tidak ada klaim bahwa kontrak telah diuji, integrasi issuer berhasil, atau produk aman untuk dana nyata.

## 1. Produk dalam satu menit

Pemilik token saham dapat **menjual sebagian pendapatan dari asetnya untuk periode tertentu**, menerima pembayaran di awal, dan tetap memiliki hak atas pokok aset tersebut. Pembeli mendapat hak atas bagian pendapatan itu selama periode yang disepakati. Pembeli juga dapat menjual kembali seluruh posisi haknya kepada orang lain sebelum periode berakhir.

Contoh: Alice memiliki token saham. Ia menjual 50% hak dividennya selama enam bulan kepada Bob dengan harga 90 USDC. Bob membayar saat membeli. Token saham Alice dikunci di kontrak sebagai sumber pendapatan. Alice tetap menanggung perubahan harga saham dan menerima bagian pendapatan yang tidak dijual.

Jika Bob menjual haknya kepada Carol, Carol menerima hak atas pendapatan berikutnya sampai tenggat awal. Pendapatan yang sudah menjadi hak Bob tetap dapat diklaim Bob, meskipun belum ia ambil.

**Ini penjualan hak pendapatan.** Harga pembelian bukan pinjaman atau deposit yang wajib dikembalikan. Dividen dapat lebih kecil dari perkiraan atau tidak ada sama sekali.

## 2. Masalah dan nilai produk

Pemegang aset mungkin membutuhkan uang sekarang, tetapi ingin mempertahankan eksposur terhadap asetnya. Pembeli lain mungkin tertarik pada pendapatan aset selama periode tertentu tanpa membeli seluruh pokoknya.

Produk menyediakan pasar yang mempertemukan keduanya. Blockchain dipakai untuk menjaga aset yang mendukung hak tersebut, mencatat pemilik hak, menggabungkan pembayaran dan perpindahan hak dalam transaksi, serta memastikan klaim mengikuti aturan yang sama untuk semua pengguna.

AI membantu pengguna memahami dan menemukan penawaran serta menyiapkan transaksi. AI tidak menentukan hak kepemilikan atau menghitung saldo klaim di luar kontrak.

Kebutuhan pengguna dan kesediaan membayar masih merupakan hipotesis produk. Demo fungsional tidak otomatis membuktikan permintaan pasar.

## 3. Keputusan yang sudah disetujui

| Aspek | Keputusan |
| --- | --- |
| Kualitas | Penerapan onchain lengkap dan bermakna; scope inti tidak dipangkas diam-diam demi demo. |
| Aset | Mendukung beberapa aset melalui daftar aset yang diizinkan, dengan mekanisme issuer yang sudah diperiksa. |
| Penjualan pertama | Pemilik dapat menjual sebagian hak pendapatan untuk periode tertentu. |
| Jual ulang | Seluruh posisi hak dijual sekaligus; tidak memecah posisi pada pasar sekunder. |
| Backing penawaran | Backing diamankan saat penawaran pertama dibuat; sebelum dibeli, seller dapat membatalkan dan mengambilnya kembali sesuai accounting. |
| Awal durasi | Periode hak pada penjualan pertama dimulai saat pembelian berhasil. Jual ulang tidak memperpanjang tenggat awal. |
| Masa penawaran | Seller memilih batas waktu penawaran, dengan default tujuh hari. Setelah kedaluwarsa, pembelian ditolak; pengambilan backing atau penawaran ulang memerlukan transaksi. |
| Harga | Harga tetap yang ditentukan penjual pada penawaran pertama maupun jual ulang. |
| Perubahan harga | Batalkan penawaran yang belum terjual lalu buat penawaran baru. Tidak ada fitur edit harga langsung; terms hak aktif tidak dapat diubah sepihak. |
| Pendapatan lama | Pendapatan yang sudah menjadi hak pemilik sebelumnya tetap miliknya setelah jual ulang. |
| Format posisi | Posisi hak dicatat langsung di smart contract dengan ID dan pemilik; tidak memakai NFT pada versi hackathon. |
| Jalur perpindahan | Jual ulang utuh melalui marketplace kontrak kita; transfer langsung/hadiah antarwallet tidak disediakan pada versi hackathon. |
| Sumber metadata | Layanan tim membaca data resmi issuer dan mengirim metadata event dengan kewenangan terbatas. Kontrak mengatur pembagian/klaim; layanan tidak mempunyai hak bebas menarik backing atau menentukan penerima. Klasifikasi tetap mengandung kepercayaan terhadap layanan. |
| Saldo payout | Pokok dan payout yang sudah dialokasikan dicatat terpisah; pertumbuhan token payout yang belum diklaim tetap milik penerima, termasuk sesudah expiry atau jual ulang. Detail normalisasi/accounting masih perlu dirancang dan diuji. |
| Jadwal klaim | Pendapatan yang sah diakui, final menurut aturan adapter, dan tersedia/backed dapat diklaim sepanjang periode maupun setelah expiry. Pengguna boleh menunda untuk menggabungkan klaim. |
| Acuan pendapatan | Baseline hasil riset: kejadian dividen yang efektif diterapkan pada token/provider selama periode hak, bukan tanggal pengumuman, waktu aplikasi membaca data, atau waktu klaim. Adapter harus membuktikan tanggal dan klasifikasinya. |
| Bentuk payout awal | Token aset terkait, tanpa kewajiban konversi otomatis ke USDC. |
| AI | Pencarian/penjelasan penawaran dan bantuan biaya/quote transaksi merupakan fitur inti. |
| Demo | Kontrak sungguhan di Ethereum Sepolia dengan token simulasi yang jelas labelnya. |
| Bukti integrasi | Target pengujian adapter terhadap token resmi melalui fork jaringan asal. Ini belum dilakukan. |
| Stack | Next.js, TypeScript, Solidity, Foundry, wagmi/viem, OpenAI API, dan Supabase. |
| Cara kerja | Mudah dikembangkan dengan bantuan AI melalui modul jelas, aturan tertulis, dan pengujian terarah. |

Baseline riset 8 Oktober merekomendasikan xStocks EVM sebagai integrasi pertama, dengan SPYx, AAPLx, dan MSFTx sebagai kandidat konfigurasi satu mekanisme. Ini belum kelulusan adapter produk atau komitmen mendukung semua token issuer. Format posisi dan model layanan metadata sudah dipilih. Kewenangan finalizer kini diterima; detail implementasi dan pengujian integrasi mengikuti OpenSpec serta bagian 12.

## 4. Simulasi ekonomi yang mudah diikuti

**Seluruh angka berikut hipotetis.** Ini bukan data dividen emiten, quote pasar, atau janji keuntungan. Asumsikan harga token tetap $100, tanpa biaya, pajak tambahan, split, atau compounding.

Alice memiliki 100 token × $100 = **$10.000**. Asumsi pendapatan bersih setara 4% setahun memberikan $200 selama enam bulan. Alice menjual 50% hak pendapatan periode tersebut kepada Bob seharga **90 USDC**.

| Waktu | Yang terjadi |
| --- | --- |
| Penawaran | Alice mengunci backing saat membuat listing. |
| Pembelian | Bob membayar 90 USDC kepada Alice; hak dan periode Bob mulai aktif. |
| Selama periode | Pendapatan dialokasikan berdasarkan event yang memenuhi aturan hak. |
| Klaim | Bob mengambil pendapatan yang sudah dialokasikan kepadanya. |
| Tenggat | Hak atas pendapatan baru berakhir. Saldo klaim lama tetap tersimpan. |
| Penyelesaian | Alice menarik pokok setelah kewajiban dan cadangan klaim dipenuhi. |

Jika total pendapatan tersedia sebagai tambahan **2 token** pada harga ilustrasi $100, bagian Bob adalah **1 token**, bagian Alice **1 token**. Bob baru menerima USDC jika ia menjual token itu melalui transaksi terpisah.

| Pendapatan total dalam periode | Nilai bagian Bob pada harga asumsi | Untung/rugi Bob atas pembayaran 90 USDC |
| --- | --- | --- |
| $200 | $100 | +$10 atau +11,11% |
| $100 | $50 | −$40 atau −44,44% |
| $0 | $0 | −$90 atau −100% |

Persentase di atas adalah hasil selama periode contoh, sebelum biaya, bukan return tahunan. Harga token saat klaim atau penjualan dapat berubah. **Tenggat tidak menciptakan dividen dan tidak mengembalikan harga pembelian Bob.**

### Contoh jual ulang

Untuk contoh terpisah, asumsikan total pendapatan enam bulan datang dalam dua event, masing-masing 1 token. Tidak ada compounding dan harga tetap seperti sebelumnya.

1. Event pertama: 0,5 token menjadi hak Alice dan 0,5 token menjadi hak Bob.
2. Bob belum mengklaim bagiannya. Ia menjual seluruh posisi hak kepada Carol seharga 45 USDC. Angka ini hanya contoh harga kesepakatan.
3. Carol membayar Bob dan mendapat hak atas sisa periode. Saldo klaim Bob sebesar 0,5 token tetap tersimpan untuk Bob.
4. Event kedua: 0,5 token menjadi hak Alice dan 0,5 token menjadi hak Carol.
5. Tenggat awal tetap berlaku. Total alokasi: Alice 1 token, Bob 0,5 token, Carol 0,5 token. Pokok awal Alice dicatat terpisah dari pendapatan.

Aturan tentang kapan sebuah event dianggap menjadi hak pengguna harus mengikuti mekanisme provider. Contoh ini tidak menyelesaikan masalah event issuer yang terlambat dilaporkan.

## 5. Istilah yang digunakan tim

| Istilah | Arti dalam produk |
| --- | --- |
| Underlying / aset dasar | Token saham yang disetor dan menghasilkan pendapatan sesuai mekanisme issuer. |
| Pokok / principal | Hak pemilik atas aset yang disetor, terpisah dari pendapatan yang dijual. Unitnya dapat berubah akibat corporate action. |
| Vault | Kontrak yang menyimpan aset dan menjaga kewajiban terhadap pemilik hak. |
| Posisi hak | Hak atas persentase pendapatan dari aset tertentu selama jangka waktu tertentu. |
| Listing / penawaran | Tawaran untuk membeli posisi hak dengan harga tetap. |
| Accrual / alokasi | Pendapatan diakui dan dicatat menjadi hak suatu alamat. |
| Claim / klaim | Pengguna mengambil saldo yang telah dialokasikan kepadanya. |
| Settlement / penyelesaian | Menutup periode dan menghitung kewajiban yang masih harus dibayar. |
| Adapter | Modul yang menerjemahkan perilaku token/provider ke aturan accounting produk. |
| Rebase | Mekanisme yang mengubah saldo token. Penyebabnya harus dikenali; tidak semua perubahan saldo adalah dividen. |
| Fork | Jaringan lokal memakai state dari jaringan asal pada blok tertentu untuk pengujian. |

## 6. Alur pengguna dan kebutuhan fitur

### A. Alice menyimpan aset dan menawarkan hak

Alice menghubungkan wallet, memilih aset yang didukung, dan menyetor token ke vault. Ia menentukan jumlah aset yang mendukung penawaran, persentase pendapatan yang dijual, harga, dan durasi.

Sebelum konfirmasi, aplikasi menunjukkan aset yang akan dikunci, sisa bagian pendapatan Alice, aturan periode, bentuk payout, biaya, dan risiko. Aset yang sama tidak boleh mendukung kewajiban yang saling bertentangan.

**Disepakati:** backing diamankan saat penawaran dibuat. Penawaran yang belum dibeli dapat dibatalkan dan backing dilepas sesuai aturan accounting; hanya backing terkait yang dikunci, bukan seluruh wallet. Hak pembeli aktif setelah pembelian berhasil; waktu akhir ditentukan dari awal aktivasi dan durasi yang disepakati. Pendapatan sebelum hak pembeli aktif tidak menjadi hak pembeli tersebut.

Masa penawaran terpisah dari periode hak. Seller memilih batas waktu penawaran dengan default tujuh hari. Jika tidak laku sampai deadline, kontrak menolak pembelian; seller mengambil backing atau memasang ulang melalui transaksi. Tidak ada transfer otomatis hanya karena waktu berlalu. Setelah pembelian, seller tidak dapat membatalkan hak aktif.

Untuk mengganti harga, seller membatalkan penawaran yang belum terjual dan membuat penawaran baru. Penawaran lama tidak lagi bisa dibeli. Pembatalan penawaran jual ulang tidak membatalkan posisi hak yang mendasarinya. Tidak ada fitur edit harga langsung dalam scope awal atau demo.

### B. Bob menemukan dan membeli hak

Bob dapat membuka pasar atau bertanya kepada AI, misalnya: “Cari penawaran di bawah 100 USDC dan jelaskan risikonya.” AI mengambil data penawaran, bukan mengarang aset atau yield.

Bob melihat harga, persentase hak, periode, underlying, sumber estimasi pendapatan, bentuk payout, serta biaya transaksi. Pembayaran kepada Alice dan pemberian hak kepada Bob harus berhasil dalam **satu transaksi kontrak**; jika salah satunya gagal, semuanya batal.

Jika Bob perlu menukar aset pembayaran, aplikasi hanya membandingkan estimasi hasil dan biaya dari sumber likuiditas nyata untuk jumlah yang diminta. Tidak ada approval, signature, pengiriman swap, atau bridge dari aplikasi. Pengguna mengurus pertukaran di luar aplikasi; saat kembali, saldo dan listing dibaca ulang sebelum pembelian hak. Membaca quote tidak membutuhkan pengguna memiliki nominal simulasi tersebut.

### C. Pendapatan diterima dan dicatat

Adapter mengenali event pendapatan yang didukung. Kontrak mengalokasikan bagian pemilik pokok dan pemilik hak menggunakan aturan periode yang eksplisit.

Saldo klaim harus didukung aset yang benar-benar tersedia. Harga saham naik, transfer token langsung ke vault, atau stock split tidak boleh otomatis dihitung sebagai dividen.

Baseline setelah delegasi rekomendasi dan riset 8 Oktober: pakai waktu kejadian dividen efektif pada token/provider. Periode adalah sejak aktivasi hak sampai sebelum tenggat; pendapatan sebelum hak aktif tidak menjadi hak buyer, dan event baru pada/setelah tenggat berada di luar posisi. Event valid yang baru diketahui sistem setelah tenggat tetap perlu dialokasikan kepada pemilik hak pada waktu event tersebut. Jadwal pencatatan/claim tidak boleh menggantikan waktu event. Cara membuktikan riwayat, ownership pada batas event, sumber klasifikasi, dan finalisasi masih menjadi gate adapter.

Pengguna boleh claim pendapatan yang telah sah diakui, final sesuai aturan, dan tersedia/backed tanpa menunggu expiry. Klaim tidak wajib setiap event, dan saldo klaim lama tetap bertahan setelah expiry. Tidak ada pembayaran dari pendapatan yang baru diperkirakan.

### D. Bob menjual hak kepada Carol

Bob menentukan harga jual seluruh posisi. Saat Carol membeli, kontrak menyelesaikan pencatatan pendapatan lama, membayar Bob, mengganti pemilik hak, dan menutup penawaran secara atomik.

Pendapatan lama Bob tidak berpindah. Carol mendapatkan pendapatan berikutnya yang memenuhi aturan sampai tenggat awal. Penawaran kedaluwarsa atau penawaran dari pemilik lama harus ditolak.

### E. Periode berakhir, klaim, dan penarikan pokok

Setelah tenggat, posisi tidak memperoleh hak atas event baru di luar periode. Klaim yang sudah tercatat tetap dapat diambil. Kontrak menolak klaim ganda.

Pokok hanya bisa dilepas setelah syarat finalisasi terpenuhi dan cadangan untuk klaim terutang diamankan. Waktu tunggu/finalitas untuk data issuer yang terlambat masih harus ditetapkan; jangan menganggap expiry langsung membolehkan seluruh saldo vault ditarik.

## 7. Scope hackathon

### Fitur inti yang harus selesai

- Registry beberapa aset yang diizinkan dan adapter untuk mekanisme yang dipilih.
- Deposit, penguncian backing, penawaran pertama, pembelian, dan pembatalan penawaran yang belum terjual.
- Pencatatan pendapatan, saldo klaim per pemilik, dan payout dalam token aset.
- Penawaran jual ulang seluruh posisi dan pembelian atomik.
- Expiry, settlement, klaim, dan penarikan pokok dengan perlindungan cadangan.
- Pasar, halaman posisi, status transaksi, serta riwayat yang dapat diverifikasi.
- AI untuk pencarian, penjelasan terms/risiko, dan bantuan quote/biaya pembayaran.
- Demo penuh di Sepolia, pengujian lokal, serta bukti adapter melalui fork jika provider memenuhi syarat.

**Urutan pengerjaan:** satu aset sampai seluruh lifecycle lolos, lalu tambahkan aset lain dengan kode yang sama. Ini urutan pengembangan, bukan pengurangan scope menjadi produk satu aset.

**Target teknis hasil riset:** tiga aset simulasi dengan mekanisme xStocks EVM, memakai kandidat SPYx/AAPLx/MSFTx sebagai referensi. Ketiga token resmi memakai implementasi yang sama pada blok yang diperiksa. Gunakan label demo yang jelas dan satu logika kontrak dengan tiga konfigurasi; dukungan adapter resmi tetap memerlukan tes fork.

### Batas awal untuk menjaga implementasi terarah

Tidak ada pemecahan posisi saat jual ulang, lelang, AMM khusus untuk hak, eksekusi swap/bridge, kontrak hak lintas chain, pinjaman, jaminan keuntungan, atau kewajiban konversi payout ke USDC. Pembacaan quote lintas chain untuk informasi diperbolehkan; ini tidak memindahkan aset. Dukungan lintas issuer memerlukan adapter tambahan dan pemeriksaan terpisah.

Batas ini menjaga pekerjaan fokus pada accounting, perdagangan hak, AI, dan bukti onchain yang benar.

## 8. Arsitektur teknis

| Lapisan | Pilihan dan tanggung jawab |
| --- | --- |
| Web | Next.js + TypeScript untuk pasar, posisi, chat, dan preview transaksi. |
| Wallet | wagmi/viem untuk membaca kontrak, menyiapkan transaksi, dan mengikuti receipt. |
| Kontrak | Solidity untuk backing, posisi hak, penawaran, pembayaran, accrual, dan klaim. |
| Pengujian | Foundry; Anvil untuk jaringan lokal, kontrol waktu, dan fork. |
| AI | OpenAI API melalui server; API key tidak masuk browser. |
| Data pendukung | Supabase untuk riwayat chat, metadata, dan cache/index event. |
| Demo publik | Ethereum Sepolia; gas dan semua token simulasi diberi label jelas. |

Usulan struktur sederhana: satu aplikasi Next.js dengan server routes, satu paket kontrak Foundry, dan satu paket ABI/tipe bersama. Tidak perlu menambah microservices hanya untuk membagi pekerjaan. Versi dependency dipilih dan dikunci saat setup; belum ada dependency yang terpasang.

### Modul kontrak yang diusulkan

- **AssetRegistry + adapter:** alamat, decimals, mekanisme pendapatan, serta aturan asset/provider yang didukung.
- **Vault/accounting:** backing, pokok, cadangan payout, dan checkpoint pendapatan.
- **RightsPosition:** identitas posisi, persentase, periode, pemilik, dan status.
- **Marketplace:** listing harga tetap, pembatalan, pembelian pertama, dan jual ulang.
- **Claim/settlement:** pembayaran klaim dan finalisasi tanpa menghabiskan cadangan.

Nama dan jumlah kontrak dapat disederhanakan jika tanggung jawab serta invariants tetap jelas. Hindari menambahkan proxy upgrade atau framework kustom tanpa kebutuhan yang nyata.

**Disetujui Wildan pada 8 Oktober: posisi hak dicatat langsung di kontrak**, dengan ID, pemilik, backing, persentase, dan tenggat; jual ulang utuh melalui marketplace kontrak kita. Transfer langsung/hadiah antarwallet tidak disediakan pada versi hackathon. Ini mempertahankan primary sale, secondary resale, pembayaran atomik, dan perlindungan klaim lama, sambil mengurangi jalur perpindahan yang harus diuji.

**Usulan ERC-721 sebelumnya digantikan oleh keputusan ledger onchain.** ERC-721 dapat dipertimbangkan pada perubahan scope berikutnya bila kompatibilitas wallet/marketplace NFT menjadi kebutuhan inti. Ledger tetap memerlukan accounting, otorisasi, event history, dan tes yang benar.

Saldo payout yang sudah dialokasikan dipisahkan dari backing pokok. Perubahan token payout, termasuk pertumbuhan akibat dividend rebase sesudah expiry, tetap menjadi milik penerima payout. Saldo tersebut tidak kembali menjadi pokok atau berpindah saat posisi dijual ulang. Detail unit share, rounding, split/fees, dan cadangan merupakan bagian desain dan pengujian, bukan bukti implementasi yang sudah selesai.

### Sumber kebenaran

Kontrak adalah sumber kebenaran untuk backing, pemilik, terms posisi, listing, pembayaran, saldo klaim, dan status penyelesaian. Supabase membantu pencarian dan tampilan, tetapi tidak menetapkan hak atau mengubah payout.

Indexer menyimpan chain ID, alamat kontrak, nomor/hash blok, transaction hash, dan event identity agar bisa deduplikasi serta memperbaiki cache saat reorg. Sebelum mengirim transaksi, baca kembali state kontrak. Cache lama tidak cukup untuk menyatakan listing masih tersedia.

Semua nominal kontrak menggunakan unit integer dengan decimals yang benar. Pembulatan dan sisa unit harus mempunyai aturan eksplisit; jangan memakai floating-point untuk pembagian uang di kontrak.

### Peran AI

AI boleh membaca aset, mencari listing, menjelaskan posisi, mengambil estimasi dengan sumber/timestamp, membandingkan quote yang tersedia, dan menyiapkan preview tindakan. Contoh nama tool seperti `searchListings`, `getPosition`, dan `getPaymentQuote` adalah rancangan interface, bukan endpoint yang sudah ada.

Pengguna tetap mengonfirmasi terms dan menandatangani melalui wallet. AI tidak memegang private key dan tidak dapat menciptakan saldo klaim. Teks listing dan hasil sumber eksternal diperlakukan sebagai data, bukan instruksi yang boleh mengubah aturan aplikasi.

Harga listing, estimasi pendapatan, dan biaya swap adalah tiga angka berbeda. Model slippage lama bukan prasyarat; data/model tersebut belum divalidasi untuk jalur transaksi ini. Bantuan rekomendasi memakai quote aktual berdasarkan jumlah dan perbandingan total biaya, tanpa klaim “terbaik di seluruh pasar”.

**Konteks AI/slippage dari diskusi Willy:** peran AI mencakup menemukan penawaran sesuai batas pengguna, menjelaskan hak/risiko, dan membantu menyiapkan pembayaran dengan biaya serta batas slippage yang terlihat. Pada scope harga hak tetap, slippage terutama relevan ketika token pembayaran perlu ditukar, bukan perubahan harga listing atau ketidakpastian dividen. Price impact dari ukuran swap, selisih quote terhadap hasil eksekusi, biaya gas, dan slippage tolerance harus dibedakan. Model bahasa mengoordinasikan tool dan penjelasan; quote serta perhitungan batas dilakukan kode. Mempertahankan fitur bantuan slippage tidak berarti bobot ML dari repo lama otomatis dipakai atau telah tervalidasi.

**Keputusan langsung Wildan — 8 Oktober 2026:** bantuan swap dibatasi pada perbandingan dan rekomendasi, tanpa integrasi eksekusi. Ini menggantikan usulan swap/pool demo sebelumnya. Hitung quote untuk jumlah penuh (misalnya 1.000 ETH), bukan harga spot dikali jumlah. Perbandingan antar-chain harus membedakan asumsi aset sudah berada pada setiap chain dari rute nyata berdasarkan chain asal dan tujuan akhir; bila biaya/waktu bridge belum dihitung, jangan memberi rekomendasi pindah chain sebagai hasil bersih terbaik. Quote saat ini adalah estimasi kondisi likuiditas sekarang, bukan prediksi ML tentang harga/fill mendatang. Pembelian dan perdagangan hak pendapatan tetap onchain; CopilotKit masih rekomendasi UI, belum diimplementasikan.

## 9. Provider aset dan accounting pendapatan

Jangan menganggap semua token saham memberikan dividen dengan cara yang sama. Dokumentasi [xStocks](https://docs.xstocks.fi/developers) menjelaskan mekanisme EVM dan sumber metadata; [dividen dan split](https://docs.xstocks.fi/docs/dividends-and-stock-splits) serta [multipliers](https://docs.xstocks.fi/developers/multipliers) perlu diperiksa bersama. [Ondo Stocks](https://docs.ondo.finance/ondo-stocks/overview) menjadi kandidat pembanding dengan struktur total return yang berbeda.

Untuk payout awal dalam token, provider dengan pendapatan yang dapat dipisahkan secara terverifikasi lebih cocok. Jika pendapatan melekat dalam harga token, membaginya membutuhkan mekanisme lain; mengganti alamat token saja tidak cukup.

Riset provider harus menghasilkan:

1. Alamat dan versi token resmi, chain, decimals, aturan transfer, serta akses yang diperlukan.
2. Mekanisme dividen bersih, split, dan corporate action lainnya; cara membedakannya dari perubahan harga/donation.
3. Data yang tersedia onchain dan data eksternal yang dibutuhkan, lengkap dengan siapa yang dipercaya.
4. Cara menjaga pokok dalam unit yang sesuai saat saldo atau multiplier berubah.
5. Aturan event/periode/finalisasi yang dapat diimplementasikan dan diuji.
6. Minimal satu pengujian fork pada blok tertentu terhadap token asli yang dipilih.

Jika memakai wrapper, cek versi dan underlying-nya. [Dokumentasi wrapped xStocks](https://docs.xstocks.fi/developers/wrapped-xstocks) memperingatkan risiko versi legacy; conversion rate wrapper juga bukan feed harga saham.

Onchain tidak otomatis membuat sumber dividen eksternal bebas kepercayaan. Jika keeper/oracle/admin memasukkan event, identitas, kewenangan, deduplikasi, dan batasnya harus dijelaskan. Simulator demo diberi label sebagai sumber simulasi, bukan oracle issuer resmi.

### Temuan riset tanggal acuan — 8 Oktober 2026

Endpoint publik [multiplier history](https://docs.xstocks.fi/apis/openapi/assets/get_public_assets_multiplier_history_by_symbol) menyediakan kategori kejadian dan waktu aktivasi; [corporate actions](https://docs.xstocks.fi/apis/openapi/corporate-actions) memuat waktu efektif, multiplier lama/baru, serta ID/versi event. Request nyata SPYx/Ethereum berhasil dan mengembalikan empat kejadian Dividend. Nilai multiplier API cocok dengan pembacaan kontrak pada blok 26145803.

Namun, array riwayat pada token yang dibaca berisi satu entri genesis, bukan empat kejadian API. Ini membuktikan ketersediaan data issuer dan kecocokan state saat ini, belum membuktikan seluruh riwayat dapat divalidasi kontrak tanpa sumber eksternal. Sumber referensi juga menyediakan perubahan jadwal multiplier dan fee; kenaikan multiplier tidak sendirinya membuktikan dividen. Tidak hardcode jam aktivasi berdasarkan jadwal umum dokumentasi; gunakan data event aktual yang divalidasi.

**Model integrasi disetujui pada 8 Oktober:** layanan tim membaca sumber resmi issuer dan mengirim metadata klasifikasi/event melalui role terbatas. Adapter memverifikasi state/values onchain yang tersedia; kontrak menentukan pembagian dan klaim. Layanan tidak diberi kewenangan bebas menarik backing atau memilih penerima payout, tetapi salah klasifikasi tetap dapat menyebabkan pembagian salah. API tidak bisa dipanggil langsung oleh kontrak EVM. Event yang belum dapat dipastikan tidak dibayarkan atau dipakai untuk melepas cadangan. Bukti lengkap event, detail izin, perubahan versi/jadwal, bounded finalization policy, dan pengujian fork masih perlu dikerjakan. xStocks tetap kandidat integrasi, bukan pilihan provider final untuk semua aset.

### Riset teknis lanjutan — 8 Oktober 2026

Laporan rinci: [riset teknis](../research/technical-notes.md); [bukti riset](../research/evidence-2026-10-08/README.md). Ringkasan berikut adalah rekomendasi desain untuk OpenSpec, bukan kontrak yang sudah diuji:

- Pembacaan SPYx/AAPLx/MSFTx pada Ethereum blok 26145883 menunjukkan decimals 18, feePerPeriod 0, dan implementation address yang sama. Bytecode implementasi cocok dengan source terverifikasi Sourcify; simulasi read-only transferShares ketiganya berhasil. Belum ada fork lifecycle produk.
- Catat backing dan klaim dalam internal shares. Pada dividen terverifikasi, retained backing shares = ceil(S × M0 / M1); selisihnya menjadi income shares yang dibagi sesuai persentase. Split tidak membentuk income; klaim lama mempertahankan shares dan pertumbuhannya. Donation tidak menjadi dividen. Rumus diperiksa pada 5000 urutan aritmetika, belum pada Solidity.
- Event dicatat berurutan per aset; posisi mempunyai cursor. Sebelum buy/resale/release, sinkronkan event dan periksa state token; operasi menunggu jika perubahan belum dikenali. Start/transfer menyimpan cursor agar batas timestamp sama tidak mengambil event milik pemilik sebelumnya.
- OpenAPI issuer tidak menyediakan status Final atau bukti batas waktu koreksi. Finalisasi oleh layanan tim dengan kewenangan terbatas telah disetujui pada baseline OpenSpec; batas trust mengikuti keputusan D-09 dan D-10. Tidak memakai timer arbitrer untuk menghapus hak terlambat; tidak menganggap metadata tak dapat direvisi atau payout dapat ditarik kembali.
- Koreksi scope 8 Oktober: quote/rekomendasi saja, tanpa eksekusi swap atau bridge. Tidak perlu membuat pool atau menyediakan liquidity untuk fitur ini. Data mainnet dapat dibaca melalui Quoter atau API aggregator sementara kontrak produk tetap di Sepolia; label kedua lingkungan harus jelas. Provider/chain awal dan integrasi quote live belum diuji.
- AI memakai tool schema ketat; kode memvalidasi data dan membentuk preview/calldata dari allowlist. Model tidak menetapkan nominal/penerima secara bebas dan pengguna tetap menandatangani.

## 10. Demo dan bukti yang perlu ditunjukkan

### A. Sepolia: seluruh lifecycle

Gunakan token simulasi yang benar-benar berjalan di kontrak, termasuk mekanisme rebase/split yang diperlukan. Kontrak mock tidak cukup hanya menampilkan angka baru di UI.

Sediakan token pembayaran simulasi berlabel, misalnya `DemoUSD`, dan beberapa token aset simulasi. Kode token dipakai ulang melalui deployment/config; jumlah simbol tidak berarti perlu membuat banyak logika berbeda. Harga atau event historis boleh digunakan dengan sumber dan timestamp, tetapi tidak membuat token mock menjadi aset resmi yang backed.

Alur demo:

1. Alice menyetor aset dan membuat penawaran.
2. Bob memakai AI untuk memahami penawaran, melihat biaya, lalu membeli.
3. Simulator memicu pendapatan; saldo klaim Alice/Bob dapat diperiksa.
4. Bob menjual seluruh hak kepada Carol, menyisakan klaim lamanya.
5. Pendapatan berikutnya dialokasikan ke Alice/Carol.
6. Tenggat berakhir; klaim lama tetap bisa diambil, klaim ganda ditolak.
7. Penyelesaian menjaga cadangan dan memungkinkan penarikan pokok sesuai aturan.
8. UI menampilkan transaction hash, alamat kontrak, dan tautan explorer.

Untuk presentasi, gunakan periode singkat, misalnya beberapa menit, dengan label bahwa itu demonstrasi kontrak enam bulan. Waktu Sepolia berjalan normal; kontrol waktu hanya dipakai pada jaringan lokal.

Kartu quote membaca pasar mainnet secara read-only dan menyebut sumber, chain, token, jumlah, timestamp/blok serta biaya yang sudah/belum tercakup. Data mainnet bukan likuiditas DemoUSD Sepolia. Bila API tidak tersedia, tampilkan unavailable atau fixture berlabel simulasi, jangan mengarang live quote. Pembelian hak demo memakai saldo token pembayaran testnet secara langsung; tidak ada swap yang dieksekusi aplikasi.

### B. Fork: kompatibilitas token resmi

Jalankan adapter terhadap state token resmi pada blok tertentu melalui RPC. Fork tidak mengharuskan membeli token dengan uang nyata. Alamat yang diberi saldo/di-impersonate dan perubahan state sintetis wajib diberi label.

Catat chain, token, blok, versi adapter, skenario, hasil, dan keterbatasan. Uji transfer/accounting dengan state asli serta perilaku corporate action yang relevan. Pengujian sintetis untuk event yang tidak terjadi pada blok tersebut dilaporkan terpisah.

Fork adalah bukti pengujian lokal terhadap state jaringan asal; bukan deployment mainnet, audit, atau bukti akses issuer produksi. Ketersediaan testnet/faucet resmi provider belum terverifikasi.

### C. Menyesuaikan penilaian hackathon

[Kriteria resmi](https://www.hackquest.io/hackathons/Ethereum-Jakarta-Hackathon-2026) memberi bobot utility 25%, onchain 25%, innovation 20%, feasibility 20%, dan demo/UX 10%. Bukti onchain kita mencakup backing, perdagangan hak, checkpoint, klaim, dan settlement yang bisa diverifikasi.

Aturan resmi juga mengharuskan core dibangun pada periode hackathon; library/API yang sudah ada boleh digunakan dengan atribusi. Dokumen ini adalah persiapan. Tim perlu memastikan jadwal, deadline, serta aturan penggunaan kode referensi sebelum mulai membangun core.

## 11. Kriteria penerimaan dan pengujian

Rancang matriks ini sebelum mengoding accounting. Hasil tiap skenario harus dicatat sebagai **lulus, gagal, terblokir, atau belum diuji**, dengan environment dan bukti. Daftar berikut adalah rencana, bukan hasil tes.

| Area | Skenario dan hasil yang harus benar |
| --- | --- |
| Deposit/listing | Aset unsupported ditolak; jumlah/persentase/durasi valid; backing tidak digunakan dua kali. |
| Pembelian | Pembayaran dan aktivasi atomik; gagal allowance/balance/transfer tidak meninggalkan hak aktif. |
| Persaingan | Dua pembeli mengejar listing sama: hanya satu berhasil; lainnya tidak membayar. |
| Pembatalan | Listing belum terjual bisa dibatalkan; listing terjual tidak bisa membatalkan hak aktif. |
| Pendapatan | Bagian pemilik pokok dan pembeli sesuai terms; event tidak dihitung dua kali. |
| Corporate action | Split menjaga proporsi ekonomi; kenaikan harga/donation tidak dianggap dividen. |
| Jual ulang | Seluruh posisi berpindah, tenggat tetap, harga dibayar ke pemilik yang sah. |
| Klaim lama | Saldo Bob tetap milik Bob setelah transfer, walaupun belum diklaim. |
| Perpindahan di luar pasar | Percobaan mengubah pemilik di luar jalur marketplace yang sah ditolak. |
| Pertumbuhan saldo payout | Rebase saldo klaim tetap milik penerima sebelum/sesudah expiry dan resale; tidak bercampur dengan pokok atau dibayar dua kali. Split/fees dinormalisasi sesuai adapter. |
| Periode | Event sebelum awal, pada batas, dan sesudah akhir mengikuti aturan yang dipilih. |
| Sumber terlambat | Event/delivery terlambat tidak menyebabkan kehilangan hak atau cadangan; perilaku sesuai finalisasi yang ditetapkan. |
| Klaim | Klaim ganda ditolak; pembulatan dan sisa unit konsisten. |
| Penarikan | Penarikan dini ditolak; penarikan pokok tidak menghabiskan aset untuk klaim terutang. |
| Isolasi | Saldo, event, dan klaim beberapa aset/pengguna tidak tercampur. |
| Keamanan kontrak | Reentrancy, kewenangan admin, event palsu/duplikat, dan kegagalan transfer tidak merusak accounting. |
| Quote/rekomendasi | Jumlah input tepat; token/chain benar; stale/no-route/API gagal ditangani; fee tidak dihitung dua kali; quote lintas chain berlabel asumsi lokasi aset; tidak ada approval/signature/swap dari fitur ini. |
| AI | Jawaban berdasarkan data; tidak mengarang yield, melakukan tanda tangan, atau mengikuti instruksi berbahaya dari listing. |
| UI/wallet | Pending, reject, gagal, retry, refresh, ganti wallet/network, dan cache lama memberi status yang benar. |
| Bukti integrasi | Mock, replay historis, fork state asli, dan fault injection dipisahkan dalam laporan. |

Invariants minimum: tidak ada klaim tanpa backing; tidak ada pendapatan dibayar dua kali; setiap posisi punya satu pemilik aktif; jumlah alokasi sesuai pendapatan yang tersedia dengan aturan pembulatan; hak jual ulang tidak memperpanjang periode; pokok/cadangan setiap aset terjaga.

Gunakan unit/integration tests dan fuzz/invariant tests yang relevan di Foundry. Lengkapi dengan alur UI nyata, pengamatan request/console, dan pemeriksaan state setelah refresh. Tes mock yang lulus tidak membuktikan kompatibilitas issuer atau kesiapan dana nyata.

## 12. Keputusan terbuka dan urutan menyelesaikannya

Bagian ini tidak menghalangi dokumen dibagikan. Beberapa keputusan **menghalangi implementasi accounting yang benar**, sehingga harus dituntaskan sebelum modul terkait dianggap selesai.

| Keputusan | Arah awal | Kapan perlu selesai |
| --- | --- | --- |
| Provider dan aset | Baseline riset: xStocks EVM dengan kandidat SPYx/AAPLx/MSFTx; source/state/eth_call diperiksa. Buktikan adapter melalui fork. | Sebelum mengklaim kompatibilitas produk. |
| Bukti event dan batas finalisasi | Acuan token-effective timestamp dan klaim saat backed sudah menjadi baseline. Buktikan timestamp/klasifikasi pada provider terpilih; tentukan ordering, keterlambatan, versi/jadwal berubah, serta finalisasi/cadangan. | Sebelum mengoding accrual/transfer/settlement final. |
| Detail sumber dan finalitas | Updater terbatas sudah dipilih; finalisasi protokol oleh layanan disetujui untuk hackathon; desain rinci mengikuti baseline OpenSpec. Issuer dapat merevisi data dan tidak ada Final flag pada API yang diperiksa. Rinci event validation, koreksi dan cadangan. | Sebelum accounting dianggap siap implementasi. |
| Konvensi durasi dan batas parameter | Lifecycle listing sudah disepakati: lock sejak listing, periode mulai purchase, listing validity default tujuh hari, cancel/relist. Tentukan representasi enam bulan dalam detik serta batas parameter. | Sebelum kontrak penawaran pertama. |
| Quote dan rekomendasi | Read-only mainnet melalui Quoter/API aggregator; tidak membangun pool atau mengirim swap/bridge. Sumber awal dan integrasi live belum diuji. | Sebelum rekomendasi disebut memakai data live yang tervalidasi. |
| Operasional | Model/budget OpenAI, RPC, wallet, Supabase, hosting, dan pengelolaan secrets. | Saat setup; tidak membutuhkan perubahan konsep produk. |
| Tim dan branding | Jobdesk ditentukan saat meet sesuai arahan Wildan; nama produk masih nama kerja. | Tidak menghalangi penyusunan spec/tasks tanpa assignee. |

Pemilihan solusi teknis rutin boleh dilakukan tim agar pekerjaan lancar. Perubahan yang menghapus fitur inti, mengubah hak ekonomi, atau menambah kepercayaan terhadap admin perlu dibahas dan dicatat jelas.

Arahan Wildan pada 8 Oktober: AI meneliti dan memilih detail implementasi yang mempunyai dasar kuat tanpa mengulang pertanyaan teknis rutin. Pertanyaan kepada pengguna diprioritaskan untuk keputusan core yang mengubah hak ekonomi, kewenangan pengelola/sumber data, atau pengalaman transfer/penguncian. Rekomendasi belum diuji harus dibedakan dari bukti kompatibilitas; preferensi ini tidak memberi izin menghapus scope inti atau mengunci pilihan ekonomi yang belum disetujui.

Prinsip pemilihan solusi untuk hackathon: pilih cara paling sederhana yang tetap memenuhi kualitas produk, fungsi inti, ketepatan hak/pembayaran, dan penerapan onchain yang bermakna. Jika opsi lebih mudah mengurangi kualitas tersebut, pilih opsi lebih baik meskipun membutuhkan kompleksitas tambahan dan jelaskan alasannya. Kompleksitas perlu mempunyai manfaat konkret; tingkat kerumitan bukan tujuan tersendiri. Persetujuan terpisah pada 8 Oktober mencakup ledger tanpa NFT, marketplace-only resale, layanan metadata terbatas, dan pertumbuhan saldo payout milik penerima; tidak mencakup kewenangan tambahan admin atau formula yang belum diverifikasi.

## 13. Usulan pembagian empat orang

Nama dan pembagian final belum ditetapkan; Wildan meminta penentuan jobdesk ditunda sampai meet. Tabel berikut tetap usulan historis untuk diskusi, bukan penugasan. Spec dan tasks dapat ditulis tanpa assignee.

| Penanggung jawab yang diusulkan | Fokus | Hasil kerja |
| --- | --- | --- |
| Anggota 1 | Kontrak, adapter, accounting, Foundry | Kontrak dan tes lifecycle/invariants; ABI serta event schema. |
| Anggota 2 | Web dan wallet | Pasar, posisi, transaksi, status, refresh dan explorer. |
| Anggota 3 | AI, server routes, quote, data pendukung | Tool berbasis data, preview, integrasi biaya, cache/indexing. |
| Anggota 4 | Riset provider, integrasi, QA dan demo | Matriks kompatibilitas, bukti fork bersama anggota 1, alur demo dan laporan pengujian. |

QA bukan tanggung jawab anggota 4 saja. Setiap pemilik modul menguji bagiannya, lalu tim menguji satu perjalanan lengkap. Jika beban tidak seimbang, tugas dipindahkan dengan interface yang tetap konsisten.

Sebelum paralel, sepakati ID aset/posisi/listing, status lifecycle, unit nominal, chain ID, ABI/events, serta bentuk data quote. Perubahan interface harus dikomunikasikan supaya AI masing-masing tidak membuat versi berbeda.

## 14. Urutan pengembangan

1. **Kunci fondasi:** provider, event/finalisasi, format posisi, terms, interface, dan matriks tes.
2. **Satu alur lokal lengkap:** deposit → beli → pendapatan → jual ulang → pendapatan → expiry → klaim → withdraw. Buktikan accounting sebelum menambah simbol.
3. **Integrasikan UI dan AI:** pembacaan state, tool pencarian, penjelasan, biaya/quote, wallet dan recovery.
4. **Perluas aset:** tambah konfigurasi/instance, uji isolasi dan perbedaan decimals.
5. **Validasi integrasi:** fork token resmi dan perbaiki adapter berdasarkan bukti.
6. **Sepolia dan presentasi:** deploy versi yang diuji, jalankan lifecycle nyata, simpan bukti explorer, selesaikan regresi, dan latihan demo.

Untuk vibecoding, minta AI mengerjakan satu modul atau satu skenario yang bisa diverifikasi per langkah. Jangan meminta seluruh platform dalam satu prompt besar. Kemudahan pengembangan datang dari kontrak/interface yang jelas, bukan menghapus kebutuhan accounting.

## 15. Instruksi untuk AI setiap anggota

Saat menerima dokumen ini, gunakan keputusan bagian 3 sebagai konteks bersama. Bedakan keputusan yang disetujui, usulan implementasi, keputusan terbuka, dan hasil yang benar-benar sudah diuji.

- Jangan mengubah produk menjadi sekadar deposit/claim, menghapus pasar sekunder, menjadikan AI fitur opsional, atau membatasi produk permanen ke satu aset tanpa persetujuan tim.
- Format hak sudah dipilih: ledger onchain tanpa NFT, resale utuh melalui marketplace kita. Jangan menganggap provider/simbol aset atau formula dividend/finalization final sudah dipilih; model updater terbatas tidak berarti kewenangan admin bebas.
- Jangan menghitung dividend yield dari kenaikan harga saham atau menjanjikan payout tetap.
- Jangan memindahkan sumber kebenaran hak/claim ke database atau AI.
- Jangan menulis accounting final sebelum aturan event, transfer, finalisasi, dan cadangan jelas.
- Baca instruksi repo, interface bersama, dan perubahan anggota lain sebelum mengedit; jangan menimpa pekerjaan orang lain.
- Gunakan GitHub issue/branch/PR untuk pekerjaan coding bermakna sesuai workflow tim. Smart contract dan pembayaran termasuk perubahan berisiko tinggi: rencanakan dan verifikasi lebih kuat.
- Laporkan file/versi yang diubah, apa yang diuji, hasilnya, dan yang belum terbukti. Jangan menyebut mock/fork sebagai keberhasilan produksi.
- Jangan menyimpan secrets dalam repo, mengirim transaksi dana nyata, atau mempublikasikan/merge/submission tanpa otorisasi yang sesuai.

Usulan prompt awal untuk masing-masing AI:

> Pahami dokumen ini sebagai konteks produk bersama. Tugas saya adalah [modul yang disepakati]. Mulai dengan menjelaskan scope modul, dependensi terhadap modul lain, keputusan terbuka yang benar-benar memblokir tugas, dan rencana verifikasi. Pertahankan fitur inti yang disetujui. Kerjakan bertahap dengan interface bersama dan jangan mengarang hasil pengujian.

## 16. Referensi dan batas bukti

Dokumentasi provider dan aturan hackathon diperiksa pada 7 Oktober 2026. Rujukan berikut membantu riset; bukan bukti implementasi tim telah berhasil.

- [Ethereum Jakarta Hackathon — aturan dan penilaian](https://www.hackquest.io/hackathons/Ethereum-Jakarta-Hackathon-2026).
- [xStocks developer documentation](https://docs.xstocks.fi/developers), [dividends and splits](https://docs.xstocks.fi/docs/dividends-and-stock-splits), [multipliers](https://docs.xstocks.fi/developers/multipliers), dan [wrapped tokens](https://docs.xstocks.fi/developers/wrapped-xstocks).
- [Ondo Stocks overview](https://docs.ondo.finance/ondo-stocks/overview).
- [Foundry Anvil](https://www.getfoundry.sh/anvil/index.html) untuk jaringan lokal/fork.
- [xStream source reference](https://github.com/LeoFranklin015/xStream/tree/0b494fcfaee517ef3146810dad9bb3b6cc7480f1): inspirasi struktur, bukan kode yang otomatis aman atau kompatibel. Hormati lisensi dan atribusi jika memakai bagian tertentu.

Keadaan terbaru pada 8 Oktober 2026: keputusan produk mencakup ledger tanpa NFT, marketplace-only resale, updater terbatas, dan pertumbuhan saldo payout milik penerimanya. Riset diperluas ke tiga token, source/bytecode implementasi terverifikasi, eth_call transferShares dan aritmetika eksploratif; infrastruktur Uniswap Sepolia juga dibaca. Laporan teknis mencatat rekomendasi accounting, urutan event, finalisasi, arsitektur dan AI. Finalizer terbatas telah disetujui dan OpenSpec diinisialisasi pada instruksi terbaru; belum ada build produk, deployment, tes Solidity, atau pengujian fork lifecycle. Jobdesk menunggu meet.
