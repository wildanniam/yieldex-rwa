import { CHAIN_IDS, INTERFACE_VERSION } from '@rwa/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordInput, TextInput } from '@/components/ui/input';

const modules = [
  [
    'Web & API',
    'apps/web',
    'Halaman starter dan health endpoint tersedia. UI produk mengikuti desain tim.',
  ],
  [
    'Worker',
    'apps/worker',
    'Proses dan shutdown tersedia. Indexer serta finalizer belum diimplementasikan.',
  ],
  [
    'Smart contracts',
    'packages/contracts',
    'Interface mengikuti spec. Belum ada market, token atau deployment.',
  ],
  [
    'Shared data',
    'packages/shared',
    'Types, validator schema dan ABI interface digunakan bersama.',
  ],
];

export default function Home() {
  return (
    <main
      id="main-content"
      className="grid min-w-0 grid-cols-12 gap-6 bg-canvas p-4 text-text-1 sm:p-6 lg:p-8"
    >
      <p className="col-span-12 text-xs font-bold tracking-widest text-text-2 uppercase">
        RWA INCOME RIGHTS · TEAM WORKSPACE
      </p>
      <h1 className="col-span-12 mt-2 text-4xl font-bold tracking-tight text-text-1 md:text-6xl">
        Fondasi siap.
        <br />
        Bangun bersama.
      </h1>
      <p className="col-span-12 max-w-2xl text-lg leading-relaxed text-text-2">
        Starter development untuk tim. Fitur marketplace, wallet, dividen, dan
        AI masih mengikuti task OpenSpec.
      </p>
      <p className="col-span-12 text-xs text-text-3">
        Interface v{INTERFACE_VERSION} · Target demo Sepolia {CHAIN_IDS.demo} ·
        Belum ada kontrak terdeploy
      </p>

      {/* Color System & Gradient Demonstrations */}
      <section className="surface-card col-span-12 my-2 rounded-card bg-card p-6">
        <h2 className="text-sm font-semibold text-text-2 uppercase tracking-wider mb-4">
          Color System & Action Hierarchy
        </h2>

        {/* Core Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button variant="primary" size="md">
            Deposit USDT (Core Action)
          </Button>
          <Button variant="accent" size="md" leadingIcon="wallet">
            Connect Wallet (Entry & AI)
          </Button>
          <Button variant="outline" size="md">
            Explore Marketplace
          </Button>
          <Button variant="ghost" size="md">
            Hi
          </Button>
        </div>

        {/* Gradients Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-inner bg-primary-gradient p-4 text-sm font-semibold text-canvas">
            <span>Primary Gradient (Top-to-Bottom)</span>
            <span className="text-xs opacity-80">Core Transactions</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-inner bg-accent-gradient p-4 text-sm font-semibold text-white">
            <span>Accent Gradient (Top-to-Bottom)</span>
            <span className="text-xs opacity-80">Entry & Intelligence</span>
          </div>
        </div>

        {/* Semantic Feedback Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-tint text-green-text border border-green-3/30">
            Active Backing
          </span>
          <span className="px-2.5 py-1 rounded-full bg-raised text-yellow border border-yellow/30">
            Expiry Approaching
          </span>
          <span className="px-2.5 py-1 rounded-full bg-raised text-danger border border-danger/30">
            Liquidated / Expired
          </span>
        </div>
      </section>

      {/* Modules List */}
      <section
        id="modules"
        aria-label="Modul development"
        className="col-span-12 grid grid-cols-12 gap-6"
      >
        {modules.map(([title, path, description]) => (
          <article
            key={path}
            className="col-span-12 border-t border-border pt-4 md:col-span-6"
          >
            <h2 className="text-lg font-semibold text-text-1 mb-1">{title}</h2>
            <code className="text-xs text-green-text">{path}</code>
            <p className="text-sm text-text-2 mt-2 leading-relaxed">
              {description}
            </p>
          </article>
        ))}
      </section>

      {/* Next Step */}
      <section
        className="col-span-12 border-t border-border pt-6"
        aria-labelledby="next-step"
      >
        <h2 id="next-step" className="text-lg font-semibold text-text-1 mb-2">
          Mulai dari task yang sama
        </h2>
        <p className="text-sm text-text-2 leading-relaxed mb-4">
          Baca README, AGENTS.md, dan task OpenSpec sebelum coding. Gunakan
          schema serta interface bersama; pembagian tugas ditentukan saat meet.
        </p>
        <a
          href="/api/health"
          className="text-green-text text-sm underline underline-offset-4 hover:text-green-1"
        >
          Periksa status proses web <span aria-hidden="true">↗</span>
        </a>
        <PasswordInput label="Hi" />
      </section>
    </main>
  );
}
