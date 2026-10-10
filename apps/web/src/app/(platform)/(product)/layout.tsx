import { PlatformShell } from '@/components/platform/shell';

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformShell>{children}</PlatformShell>;
}
