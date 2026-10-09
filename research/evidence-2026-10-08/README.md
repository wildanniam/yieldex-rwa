# Bukti riset 8 Oktober 2026

Ini snapshot hasil riset, bukan deployment atau tes kontrak produk.

- `summary.json`: metadata, alamat dan pembacaan state tiga aset pada Ethereum blok 26145883.
- `*-chain.json`: respons RPC mentah untuk bytecode proxy, slot implementasi, multiplier, fee, decimals dan konversi shares pada blok tersebut.
- `*-corporate.json`, `*-history.json`: respons history issuer yang berhasil diambil; tidak membuktikan semua event masa depan atau data yang tidak dilaporkan issuer.
- `api-manifest.json`: URL, HTTP status dan SHA-256 atas respons 12 request. Respons metadata/current multiplier lengkap berada di direktori temporer riset; field relevannya dipertahankan pada summary.
- `source-and-router-summary.json`: percobaan source awal, simulasi SPYx, serta kode kontrak resmi Uniswap pada Sepolia blok 11868384. Kegagalan Sourcify legacy pada file ini digantikan keberhasilan v2 di file berikutnya.
- `extra-checks.json`: source explorer/Sourcify v2 dan `eth_call transferShares` tiga token dari alamat wrapper publik yang memiliki saldo. Tidak ada transaksi ditandatangani atau saldo nyata dipindahkan.
- `verification-summary.json`: exact-match verifier, kecocokan bytecode RPC dengan verifier, source referensi, dan schema event issuer. `lastRpcError` merekam percobaan gagal sebelum RPC cadangan berhasil.
- `arithmetic-results.json`: pemeriksaan aritmetika integer/Fraction 5000 urutan, 85000 transisi dividen. Bukan tes Solidity atau fork.

Metode RPC: blok diambil melalui `eth_getBlockByNumber("finalized", false)`; semua pembacaan aset berikutnya menggunakan nomor blok tetap. Selector dihitung memakai `web3_sha3` atas signature fungsi. Slot ERC-1967 implementation dibaca dengan `eth_getStorageAt`. Source Sourcify v2 dibandingkan dengan `eth_getCode` alamat implementasi pada blok yang sama. Endpoint awal PublicNode; fallback dRPC dipakai untuk pemeriksaan yang terkena HTTP 403.

Paket ini mempertahankan snapshot terpilih dan sintesis hasil. Script eksperimen sementara serta respons mentah lengkap tidak disertakan; reproduksi penuh eksperimen riset memerlukan penyusunan ulang script.

Interpretasi dan rekomendasi ada pada [riset teknis](../technical-notes.md). Source/token dapat berubah; jangan memakai snapshot ini sebagai jaminan keadaan produksi saat deployment.
