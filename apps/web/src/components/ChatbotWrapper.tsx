'use client';
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
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
  const [sparkMotion, setSparkMotion] = useState(true);
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
          <button
            type="button"
            className={styles.chatBubble}
            data-motion={sparkMotion && !busy ? 'on' : 'off'}
            aria-label={busy ? 'Membuka chat…' : 'Tanya Yieldex Assistant'}
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={() => void start()}
          >
            <span className={styles.bubbleHint}>
              {busy ? 'Membuka chat…' : 'Tanya Yieldex'}
            </span>
            <svg
              className={styles.bubbleFace}
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 8h22a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5H19l-8 5v-5H9a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <g className={styles.bubbleEyes}>
                <path
                  d="M14 17v4m12-4v4"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
              <path
                d="M17 25q3 2 6 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className={styles.fairyOrbit} aria-hidden="true">
              <span>✦</span>
            </span>
            <span
              className={`${styles.fairyOrbit} ${styles.fairySecond}`}
              aria-hidden="true"
            >
              <span>✧</span>
            </span>
          </button>
          <button
            type="button"
            className={styles.motionToggle}
            onClick={() => setSparkMotion((value) => !value)}
            aria-label={
              sparkMotion ? 'Jeda animasi bubble' : 'Aktifkan animasi bubble'
            }
            aria-pressed={!sparkMotion}
          >
            {sparkMotion ? 'Ⅱ' : '▷'}
          </button>
          {error && <p role="alert">{error}</p>}
        </aside>
      )}
    </AssistantContext.Provider>
  );
}
