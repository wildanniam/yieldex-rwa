import Link from 'next/link';

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-border bg-canvas/80 px-8 backdrop-blur">
      <h1 className="text-2xl font-semibold text-text-1">Marketplace</h1>
      <Link
        aria-label="Akun Alice Henderson"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-green-text text-sm font-semibold text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-2"
        href="/settings"
      >
        AH
      </Link>
    </header>
  );
}
