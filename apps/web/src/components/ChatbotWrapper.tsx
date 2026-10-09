'use client';
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Button } from './ui/button';
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
  open,
  setOpen,
}: {
  session: ChatSession;
  close: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [error, setError] = useState(false);
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
const AssistantContext = createContext<{
  open: () => void;
  busy: boolean;
} | null>(null);
export function useAssistant() {
  const value = useContext(AssistantContext);
  if (!value) throw new Error('Assistant trigger requires ChatbotWrapper');
  return value;
}
export function ChatbotWrapper({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(true);
  const pending = useRef(false);
  async function start() {
    if (session) {
      setOpen(true);
      return;
    }
    if (pending.current) return;
    pending.current = true;
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
      setOpen(true);
      setSession(data);
    } catch {
      setError(
        'Chat belum tersedia. Marketplace dan quote manual tetap bisa digunakan.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <AssistantContext.Provider value={{ open: () => void start(), busy }}>
      {children}
      {session ? (
        <ConnectedChat
          key={session.threadId}
          session={session}
          open={open}
          setOpen={setOpen}
          close={() => setSession(null)}
        />
      ) : (
        <aside className={styles.launcher}>
          <Button
            variant="accent"
            leadingIcon="sparkles"
            isLoading={busy}
            onClick={() => void start()}
          >
            {busy ? 'Membuka chat…' : 'Tanya Yieldex Assistant'}
          </Button>
          {error && <p role="alert">{error}</p>}
        </aside>
      )}
    </AssistantContext.Provider>
  );
}
