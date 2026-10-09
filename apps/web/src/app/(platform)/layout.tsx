import { PlatformBackground } from '@/components/platform/background';

/** Product routes share this layout; Next preserves it across menu navigation. */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformBackground>{children}</PlatformBackground>;
}
