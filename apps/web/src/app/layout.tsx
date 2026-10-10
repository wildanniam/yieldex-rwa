import type { Metadata } from 'next';
import './globals.css';
import { WalletSessionGuard } from '@/features/marketplace/use-wallet-session';
import { ChatbotWrapper } from '@/components/ChatbotWrapper';
export const metadata: Metadata = {
  title: {
    default: 'Yieldex — Income on your terms',
    template: '%s | Yieldex',
  },
  description:
    'Trade time-limited income rights. Keep your principal. Explore the Yieldex demo on Ethereum Sepolia.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WalletSessionGuard />
        <ChatbotWrapper>{children}</ChatbotWrapper>
      </body>
    </html>
  );
}
