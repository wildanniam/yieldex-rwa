import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RWA · Development starter',
  description: 'Fondasi development bersama tim RWA Income Rights.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
