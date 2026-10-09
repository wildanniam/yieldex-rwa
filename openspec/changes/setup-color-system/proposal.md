## Why

Aplikasi memerlukan sistem token warna terpadu yang mematuhi spesifikasi desain visual Web3 RWA Hackathon untuk 18 named tokens, CSS variable definitions, dan pemetaan Tailwind CSS agar konsistensi estetika antarmuka terjaga dan terstandarisasi di seluruh modul.

## What Changes

- Menambahkan definisi CSS variables untuk seluruh token warna di `:root` dan `@theme` dalam `apps/web/src/app/globals.css`.
- Menambahkan konfigurasi Tailwind CSS (`apps/web/tailwind.config.ts`) dengan pemetaan `theme.extend.colors` ke `var(--...)`.
- Menyediakan kelas utilitas khusus gradien vertikal (`primary-gradient` dan `accent-gradient`).
- Mendokumentasikan aturan semantik desain sistem sebagai komentar standar:
  - Green executes core actions.
  - Purple supports entry and intelligence.
  - Yellow and Red remain semantic, never decorative.
- Memperbarui halaman utama `apps/web/src/app/page.tsx` untuk mendemonstrasikan palet warna dan utilitas gradien baru.

## Capabilities

### New Capabilities
- `color-system`: Named design tokens, CSS variables, Tailwind color mapping, semantic action hierarchy, and vertical linear gradients.

### Modified Capabilities
Tidak ada.

## Impact

- Memengaruhi `apps/web/src/app/globals.css`, `apps/web/tailwind.config.ts`, dan komponen antarmuka web.
