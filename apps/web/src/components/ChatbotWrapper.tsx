'use client';
import { useState, useMemo, type ReactNode } from 'react';
import { CopilotKit, CopilotPopup } from '@copilotkit/react-core/v2';
import type { ReactToolCallRenderer } from '@copilotkit/react-core/v2';
import '@copilotkit/react-core/v2/styles.css';
import { ToolResult } from '../features/assistant/cards';
import styles from '../features/assistant/chat.module.css';

type ChatSession = { threadId: string; ticket: string; authenticated: boolean };
const toolNames = [
  'searchListings',
  'getListing',
  'getPosition',
  'getAssetContext',
  'getPaymentQuotes',
  'preparePurchase',
];
// Only the fresh user message is accepted by our server. History and tool results are server-owned.
const latestUser = (messages: { role: string }[]) =>
  messages.filter((m) => m.role === 'user').slice(-1);
function ConnectedChat({
  session,
  close,
}: {
  session: ChatSession;
  close: () => void;
}) {
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(true);
  const renderers = useMemo<ReactToolCallRenderer[]>(
    () =>
      toolNames.map((name) => ({
        name,
        render: (props) => (
          <ToolResult {...props} threadId={session.threadId} />
        ),
      })),
    [session.threadId],
  );
  return (
    <>
      <CopilotKit
        runtimeUrl="/api/copilotkit"
        useSingleEndpoint
        credentials="same-origin"
        headers={{ 'x-yieldex-chat-ticket': session.ticket }}
        enableInspector={false}
        renderToolCalls={renderers}
        messageFilter={(messages) => latestUser(messages) as typeof messages}
      >
        <CopilotPopup
          open={open}
          onOpenChange={setOpen}
          threadId={session.threadId}
          width="min(460px, 100vw)"
          height="min(680px, 90dvh)"
          onError={(event) => {
            if (
              !('error' in event) ||
              !/dihentikan|stopped/i.test(event.error.message)
            ) {
              setError(true);
              setOpen(false);
            }
          }}
          labels={{
            modalHeaderTitle: 'Yieldex Assistant',
            chatInputPlaceholder: 'Cari penawaran atau bandingkan quote…',
            welcomeMessageText:
              'Halo! Aku bisa mencari hak pendapatan, menjelaskan aset, dan membandingkan quote ETH/USDC.',
            chatDisclaimerText:
              'Chat sementara. Pendapatan tidak dijamin. Quote mainnet terpisah dari DemoUSD Sepolia.',
            chatToggleOpenLabel: 'Buka Yieldex Assistant',
            chatToggleCloseLabel: 'Tutup chat',
          }}
        />
      </CopilotKit>
      {error && (
        <div className={styles.launcher} role="alert">
          <p>
            Chat terputus atau sesi berubah. Buka chat baru untuk mencoba lagi.
            Marketplace tetap tersedia.
          </p>
          <button onClick={close}>Tutup dan mulai ulang</button>
        </div>
      )}
    </>
  );
}
export function ChatbotWrapper({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function start() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/assistant/session', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const data = await response.json();
      if (
        !response.ok ||
        typeof data.threadId !== 'string' ||
        typeof data.ticket !== 'string'
      )
        throw new Error(
          'Chat belum tersedia. Marketplace dan quote manual tetap bisa digunakan.',
        );
      setSession(data);
    } catch {
      setError(
        'Chat belum tersedia. Marketplace dan quote manual tetap bisa digunakan.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {children}
      {session ? (
        <ConnectedChat
          key={session.threadId}
          session={session}
          close={() => setSession(null)}
        />
      ) : (
        <aside className={styles.launcher}>
          <button disabled={busy} onClick={() => void start()}>
            {busy ? 'Membuka chat…' : 'Tanya Yieldex Assistant'}
          </button>
          {error && <p role="alert">{error}</p>}
        </aside>
      )}
    </>
  );
}
