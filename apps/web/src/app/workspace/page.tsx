import { CHAIN_IDS, INTERFACE_VERSION } from '@rwa/shared';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/input';
import { GradientSamples } from '@/components/ui/gradient-samples';
import Link from 'next/link';

const modules = [
  [
    'Web & API',
    'apps/web',
    'Read API, private history, quote dan functional wallet lab tersedia. UI final mengikuti desain tim.',
  ],
  [
    'Worker',
    'apps/worker',
    'Finalized indexer dan reviewed finalizer tersedia. Event issuer tetap memerlukan pemeriksaan sumber.',
  ],
  [
    'Smart contracts',
    'packages/contracts',
    'Market, registry, adapter dan token simulasi terdeploy di Sepolia; lihat runbook hosted untuk bukti dan batas demo.',
  ],
  [
    'Shared data',
    'packages/shared',
    'Types, validator schema, compiled ABI dan transaction builder digunakan bersama.',
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
        Core marketplace tersedia untuk integrasi tim. Uji wallet dan pendapatan
        di lab; UI final dan acceptance chatbot tetap mengikuti OpenSpec.
      </p>
      <p className="col-span-12 text-xs text-text-3">
        Interface v{INTERFACE_VERSION} · Target demo Sepolia {CHAIN_IDS.demo} ·
        Token simulasi · Deployment mengikuti konfigurasi environment
      </p>

      {/* Color System & Gradient Demonstrations */}
      <section className="surface-card col-span-12 my-2 rounded-card bg-card p-6">
        <h2 className="text-sm font-semibold text-text-2 uppercase tracking-wider mb-4">
          Color System & Action Hierarchy
        </h2>

        <p className="mb-4 text-sm text-text-2">
          Contoh komponen visual; tombol di bawah tidak terhubung ke wallet atau
          transaksi. Gunakan Marketplace lab untuk alur fungsional.
        </p>
        {/* Core Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button variant="primary" size="md">
            Deposit DemoUSD (contoh UI)
          </Button>
          <Button variant="accent" size="md" leadingIcon="wallet">
            Connect Wallet (contoh UI)
          </Button>
          <Button variant="outline" size="md">
            Explore Marketplace (contoh UI)
          </Button>
          <Button variant="ghost" size="md">
            Lihat detail
          </Button>
        </div>

        <GradientSamples />
        <Link
          href="/design-system"
          className="mt-6 inline-flex text-sm text-green-text underline underline-offset-4"
        >
          Lihat semua komponen dan state →
        </Link>

        {/* Semantic Feedback Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-tint text-green-text border border-green-3/30">
            Active Backing
          </span>
          <span className="px-2.5 py-1 rounded-full bg-raised text-yellow border border-yellow/30">
            Expiry Approaching
          </span>
          <span className="px-2.5 py-1 rounded-full bg-raised text-danger border border-danger/30">
            Expired (contoh UI)
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
          schema serta interface bersama; ownership aktif ada di execution plan.
        </p>
        <a
          href="/lab"
          className="mr-4 text-green-text underline underline-offset-4"
        >
          Buka functional wallet lab →
        </a>
        <a
          href="/api/health"
          className="text-green-text text-sm underline underline-offset-4 hover:text-green-1"
        >
          Periksa status proses web <span aria-hidden="true">↗</span>
        </a>
        <PasswordInput
          id="password-example"
          label="Contoh password (hanya UI)"
          autoComplete="off"
        />
      </section>
    </main>
  );
}
