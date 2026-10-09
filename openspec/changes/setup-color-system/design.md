## Context

Aplikasi frontend Web3 RWA membutuhkan palet warna konsisten dan semantik yang ketat untuk membangun antarmuka terpercaya bagi investor institusional dan ritel. Spesifikasi desain menetapkan 18 token warna dasar, 1 input-border token, dan 2 gradien vertikal.

## Goals / Non-Goals

**Goals:**
- Menerapkan seluruh 18 named tokens + input-border sebagai CSS custom properties di `:root` dan `@theme`.
- Memetakan setiap token di `tailwind.config.ts` untuk penggunaan class utilitas (`bg-*`, `text-*`, `border-*`).
- Menyediakan kelas utilitas khusus untuk `bg-primary-gradient` dan `bg-accent-gradient`.
- Mencantumkan komentar aturan semantik eksplisit di berkas kode sumber.
- Memperbarui `page.tsx` untuk menampilkan palet dan sistem warna baru.

**Non-Goals:**
- Mengubah arsitektur tema dinamis runtime di luar CSS variables.
- Menambahkan palet dekoratif acak di luar spesifikasi tim desainer.

## Decisions

- **CSS Variables + @theme**: Menggunakan `:root` standar CSS variables yang diintegrasikan dengan `@theme` Tailwind CSS v4 dan `tailwind.config.ts` agar kompatibel baik di mode runtime murni maupun Tailwind compiler.
- **Top-to-Bottom Gradients**: Diimplementasikan dengan `linear-gradient(to bottom, ...)` dalam CSS utilities class dan Tailwind background-image configuration.

## Risks / Trade-offs

- [Duplikasi konfigurasi antara Tailwind v4 @theme dan tailwind.config.ts] → Diatasi dengan mengarahkan `tailwind.config.ts` merujuk langsung ke `var(--<token>)`.
