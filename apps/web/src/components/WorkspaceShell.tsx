import Link from 'next/link';
import type { ReactNode } from 'react';
export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[1440px]">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="flex h-[72px] items-center border-b border-border px-4 sm:px-6 lg:px-8">
          <Link
            className="text-sm font-semibold tracking-wide text-text-1"
            href="/"
          >
            RWA INCOME RIGHTS
          </Link>
        </header>
        <div className="flex min-w-0 flex-col lg:flex-row">
          <aside className="shrink-0 border-b border-border p-2 lg:w-[248px] lg:border-b-0 lg:border-r lg:p-4">
            <nav
              aria-label="Navigasi utama"
              className="flex flex-wrap gap-2 lg:flex-col"
            >
              <Link
                className="rounded-inner px-2 py-2 text-sm text-text-2 hover:text-green-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-2"
                href="/workspace#main-content"
              >
                Workspace
              </Link>
              <Link
                className="rounded-inner px-2 py-2 text-sm text-text-2 hover:text-green-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-2"
                href="/workspace#modules"
              >
                Development modules
              </Link>
              <Link
                className="rounded-inner px-2 py-2 text-sm text-text-2 hover:text-green-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-2"
                href="/lab"
              >
                Marketplace lab
              </Link>
              <Link
                className="rounded-inner px-2 py-2 text-sm text-text-2 hover:text-green-1 focus-visible:outline-2 focus-visible:outline-green-2"
                href="/design-system"
              >
                Design system
              </Link>
            </nav>
          </aside>
          <div className="min-w-0 flex-1 pb-24">{children}</div>
        </div>
      </div>
    </div>
  );
}
