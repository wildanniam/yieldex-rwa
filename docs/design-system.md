# Yieldex shared design system

Sumber visual: [Figma Yieldex — Foundations](https://www.figma.com/design/XgSDQCwLb41j9XjTDwLtM2/Design-Yieldex?node-id=44-822). Verifikasi terhadap file pada 9 Oktober 2026. Halaman `/design-system` adalah katalog interaktif lokal yang memakai komponen produksi bersama, bukan implementasi alur transaksi.

## Acuan untuk slicing dan integrasi

| Area               | Figma node             | Implementasi                                                  |
| ------------------ | ---------------------- | ------------------------------------------------------------- |
| Warna dan gradient | `44:837`, `44:920`     | `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts` |
| Buttons            | `44:1243`              | `apps/web/src/components/ui/button.tsx`                       |
| Forms              | `44:1622`              | `apps/web/src/components/ui/`                                 |
| Ikon               | `46:901`–`46:940`      | `apps/web/public/icons/`, typed `IconName`                    |
| Katalog            | referensi area di atas | `apps/web/src/app/design-system/`                             |

Gunakan komponen bersama; jangan salin markup katalog ke halaman produk. Ukuran dan state mengikuti Figma, sementara posisi komponen di halaman produk tetap mengikuti slicing Afer. Aturan data, wallet, transaksi, dan API tetap mengikuti spec core.

## Buttons

Empat variant: `primary`, `accent`, `outline`, `ghost`. Tiga ukuran: `lg` 48 px / padding horizontal 28 px / label 16 px; `md` 40 / 24 / 14; `sm` 32 / 16 / 13. Label weight 500, pill radius, ikon 20 px, jarak ikon 8 px.

- Primary menggunakan gradient green-1 → green-2 → green-3; label `#092011`. Hover solid green-1, pressed solid green-3.
- Accent menggunakan gradient purple-1 → purple-2 → purple-3; label putih. Hover solid purple-1, pressed solid purple-3.
- Outline dan ghost memakai text-1; interaksi memakai green-1/green-3.
- Focus keyboard memakai ring green-text 2 px dengan offset canvas 2 px.
- Disabled opacity 40%. Loading tetap opacity 100%, native disabled, `aria-busy`, dan loader sesuai warna variant. Reduced-motion menghentikan putaran.
- `type` default `button`; hanya tombol submit yang diberikan `type="submit"`.
- `leadingIcon`/`trailingIcon` menerima `IconName`, dekoratif, mengikuti warna label.

Gradient harus berada di layer utility Tailwind. Deklarasi CSS tanpa layer pernah mengalahkan `hover:bg-none`, sehingga gradient tidak berubah saat hover. Jangan kembalikan deklarasi tersebut.

Matriks katalog menampilkan 72 spesimen (4 × 3 × 6). Spesimen hover/pressed/focus dipaksa lewat CSS khusus katalog; playground di bawahnya menggunakan event native untuk verifikasi perilaku sebenarnya.

## Form controls

Text, password, amount, select, slider, segmented control, checkbox, toggle, OTP, dan search tersedia. Field utama: tinggi 48 px, radius 12 px, label 14/20 medium text-1, helper 12/16 text-2. Error menggantikan helper dan tetap merah ketika fokus. Komponen menghasilkan ID label/message otomatis; caller masih bisa memberi ID dan `aria-describedby`.

- Password dan amount menempatkan eye/MAX di dalam control, terpisah dari label/helper. Disabled berlaku ke affordance tersebut juga. MAX membutuhkan callback, tidak menghitung balance sendiri.
- Slider, toggle, segmented, dan OTP mendukung controlled/uncontrolled. Radio, checkbox, range, select dan button memakai elemen native agar keyboard serta disabled tetap berfungsi.
- OTP menjaga posisi slot kosong dengan spasi pada **state UI**; menghapus digit tengah tidak menggeser digit lain. Caller hanya boleh mengirim kode lengkap yang memenuhi `/^[0-9]{length}$/`. Ini bukan implementasi autentikasi.
- Angka persentase slider hanya state presentasi. Jangan gunakan JS float dari UI untuk financial accounting; serialisasi uang/ID tetap mengikuti shared schemas.
- Amount hanya menampilkan estimasi/saldo yang diberikan caller. Katalog memberi contoh berlabel simulasi, tanpa menganggapnya data live.
- Search adalah field; caller bertanggung jawab terhadap pencarian dan shortcut aplikasi. Badge shortcut tidak mendaftarkan global keyboard handler.

## Assets dan typography

40 nama ikon lama dipertahankan. Dari perbandingan geometry export, 8 sudah cocok dan dipertahankan; 32 diselaraskan dengan SVG asli Figma. SVG loader (20×20) dan thumb slider (16×16) disimpan dalam `public/ui/`. Tidak ada dependency icon pack baru, base64 SVG, atau URL Figma sementara dalam runtime.

`docs/design-system-assets.json` mencatat path, node sumber, ukuran intrinsik dan SHA-256. Tes menjaga manifest/inventory/geometry file yang telah ditinjau. Saat re-export asset, pertahankan root width/height/viewBox dan perbarui manifest setelah review visual.

`Icon` default tetap menggunakan Next Image. Opsi `inheritColor` menggunakan file SVG yang sama sebagai CSS mask untuk mengikuti warna label tanpa mengubah path geometry.

Figma menggunakan Inter sementara Google Sans masih pending. Inter variable 4.1 di-host lokal di `public/fonts/InterVariable.woff2`, dengan OFL di `public/fonts/OFL-Inter.txt`. Sumber resmi: [Inter](https://rsms.me/inter/) dan [lisensi Inter 4.1](https://github.com/rsms/inter/blob/v4.1/LICENSE.txt). Tidak ada fetch font saat build.

## Batas scope

Katalog ini mencakup foundations, buttons, ikon, dan 10 form controls yang telah ada. Board Figma juga memiliki navigation, data cards, feedback, overlay dan komponen halaman lain; itu tetap pekerjaan slicing/integrasi berikutnya. Katalog bukan bukti semua desain aplikasi sudah terimplementasi. Tidak ada perubahan kontrak, schema, backend, quote provider, signer, atau alur transaksi dari pekerjaan ini.
