import type { Metadata } from 'next';
import './globals.css';
import { ChatbotWrapper } from '../components/ChatbotWrapper';
import { AppSidebar } from '../components/navigation/app-sidebar';
import { AppTopBar } from '../components/navigation/app-top-bar';

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
        <ChatbotWrapper>
          <div className="flex min-h-screen bg-canvas text-text-1">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
              <AppTopBar />
              <main className="flex-1 p-8">{children}</main>
            </div>
          </div>
        </ChatbotWrapper>
      </body>
    </html>
  );
}
