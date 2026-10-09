'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/icon';

type NavigationItem = {
  href: string;
  label: string;
  icon: IconName;
};

const sections: { label: string; items: NavigationItem[] }[] = [
  {
    label: 'Trade',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'layers' },
      { href: '/marketplace', label: 'Marketplace', icon: 'tag' },
      { href: '/sell', label: 'Sell', icon: 'plus' },
      { href: '/listings', label: 'My Listings', icon: 'receipt' },
    ],
  },
  {
    label: 'Portfolio',
    items: [
      { href: '/positions', label: 'My Positions', icon: 'vault' },
      { href: '/claims', label: 'Claims', icon: 'external-link' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/ai-assistant', label: 'AI Assistant', icon: 'sparkles' },
      { href: '/activity', label: 'Activity', icon: 'history' },
      { href: '/assets', label: 'Assets', icon: 'layers' },
      { href: '/demo-console', label: 'Demo Console', icon: 'globe' },
      { href: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[248px] shrink-0 border-r border-border bg-canvas">
      <div className="sticky top-0 flex min-h-screen flex-col px-4 py-6">
        <Link
          aria-label="Yieldex"
          className="mb-10 flex items-center px-2"
          href="/dashboard"
        >
          <Image
            alt="Yieldex"
            height={38}
            priority
            src="/logo/logo.png"
            width={147}
          />
        </Link>

        <nav aria-label="Navigasi utama" className="flex flex-col gap-7">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="mb-3 px-2 text-xs text-text-3">{section.label}</p>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex h-11 items-center gap-3 rounded-[12px] px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-2 ${
                        active
                          ? 'bg-tint text-green-text'
                          : 'text-text-2 hover:bg-tint hover:text-green-text'
                      }`}
                      href={item.href}
                    >
                      <Icon
                        alt=""
                        name={item.icon}
                        size={20}
                        {...(active ? { className: 'nav-icon-active' } : {})}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-border px-2 pt-6 text-xs text-text-3">
          Ethereum Sepolia · 11155111
        </div>
      </div>
    </aside>
  );
}
