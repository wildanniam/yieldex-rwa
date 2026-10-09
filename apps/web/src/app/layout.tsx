import type { Metadata } from 'next';
import './globals.css';
import { ChatbotWrapper } from '../components/ChatbotWrapper';

export const metadata: Metadata = {
  title: 'RWA · Development starter',
  description: 'Fondasi development bersama tim RWA Income Rights.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <ChatbotWrapper>{children}</ChatbotWrapper>
      </body>
    </html>
  );
}
