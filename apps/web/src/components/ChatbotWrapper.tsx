'use client';
import type { ReactNode } from 'react';

export function ChatbotWrapper({ children }: { children: ReactNode }) {
  // Global floating popup has been removed in favor of the full-page /chat route.
  return <>{children}</>;
}
