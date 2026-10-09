import { CHAIN_IDS, INTERFACE_VERSION } from '@rwa/shared';
import { ChatbotWrapper } from '../components/ChatbotWrapper';

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
    <ChatbotWrapper>
      <main>
        <p className="eyebrow">RWA INCOME RIGHTS · TEAM WORKSPACE</p>
        <h1>
          Fondasi siap.
          <br />
          Bangun bersama.
        </h1>
        <p className="intro">
          Starter development untuk tim. Fitur marketplace, wallet, dividen, dan
          AI masih mengikuti task OpenSpec.
        </p>
        <p className="meta">
          Interface v{INTERFACE_VERSION} · Target demo Sepolia {CHAIN_IDS.demo} ·
          Belum ada kontrak terdeploy
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
            schema serta interface bersama; pembagian tugas ditentukan saat meet.
          </p>
          <a href="/api/health">
            Periksa status proses web <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>
    </ChatbotWrapper>
  );
}
