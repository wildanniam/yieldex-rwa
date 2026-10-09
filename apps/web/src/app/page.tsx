import { CHAIN_IDS, INTERFACE_VERSION } from '@rwa/shared';

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
    'Market, registry, adapter dan token simulasi diuji lokal. Sepolia belum dideploy.',
  ],
  [
    'Shared data',
    'packages/shared',
    'Types, validator schema, compiled ABI dan transaction builder digunakan bersama.',
  ],
];

export default function Home() {
  return (
    <main>
      <p className="eyebrow">RWA INCOME RIGHTS · TEAM WORKSPACE</p>
      <h1>
        Fondasi siap.
        <br />
        Bangun bersama.
      </h1>
      <p className="intro">
        Core lokal untuk integrasi tim. Alur marketplace, wallet dan dividen
        dapat diuji di lab; UI final dan chatbot mengikuti workstream tim.
      </p>
      <p className="meta">
        Interface v{INTERFACE_VERSION} · Target demo Sepolia {CHAIN_IDS.demo} ·
        Deployment Sepolia belum tersedia
      </p>
      <section aria-label="Modul development" className="modules">
        {modules.map(([title, path, description]) => (
          <article key={path}>
            <h2>{title}</h2>
            <code>{path}</code>
            <p>{description}</p>
          </article>
        ))}
      </section>
      <section className="next" aria-labelledby="next-step">
        <h2 id="next-step">Mulai dari task yang sama</h2>
        <p>
          Baca README, AGENTS.md, dan task OpenSpec sebelum coding. Gunakan
          schema serta interface bersama; ownership aktif ada di execution plan.
        </p>
        <a href="/lab">Buka functional wallet lab →</a>
        <a href="/api/health">
          Periksa status proses web <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>
  );
}
