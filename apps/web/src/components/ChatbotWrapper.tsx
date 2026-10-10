'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ComponentProps,
} from 'react';
import {
  CopilotKit,
  CopilotChat,
  type ReactToolCallRenderer,
} from '@copilotkit/react-core/v2';
import '@copilotkit/react-core/v2/styles.css';
import { validateData } from '@rwa/shared/validation';
import type { Conversation } from '@rwa/shared';
import { ToolActivityContext, ToolResult } from '@/features/assistant/cards';
import { ConversationView } from '@/features/assistant/presentation';
import {
  CHAT_STORAGE_KEY,
  ChatSessionFailure,
  chatSessionFailure,
  latestUserMessage,
  parseChatSession,
  type ChatSession,
} from '@/features/assistant/session';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ensureWalletSession } from '@/features/marketplace/use-wallet-session';
import s from '@/features/assistant/chat.module.css';

const tools = [
  'searchListings',
  'getListing',
  'getPosition',
  'getAssetContext',
  'getPaymentQuotes',
  'preparePurchase',
  'savedCard', // Renderer only; never a model-callable tool.
];
const AssistantContext = createContext<{
  open: () => void;
  busy: boolean;
  mountPage: (host: HTMLElement | null) => void;
} | null>(null);
export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) throw new Error('Assistant trigger requires ChatbotWrapper');
  return context;
}
const PresentationContext = createContext<{
  setRunning: (running: boolean) => void;
  clearError: () => void;
  blocked: boolean;
}>({ setRunning: () => {}, clearError: () => {}, blocked: false });
function ChatPresentation(props: ComponentProps<typeof CopilotChat.View>) {
  const context = useContext(PresentationContext);
  return (
    <ConversationView
      {...props}
      onRunningChange={context.setRunning}
      onClearError={context.clearError}
      blocked={context.blocked}
    />
  );
}
function ChatRuntime({
  session,
  error,
  setError,
  setRunning,
  epoch,
  running,
  busy,
}: {
  session: ChatSession;
  error: string;
  setError: (value: string) => void;
  setRunning: (value: boolean) => void;
  epoch: number;
  running: boolean;
  busy: boolean;
}) {
  const renderers = useMemo<ReactToolCallRenderer[]>(
    () =>
      tools.map((name) => ({
        name,
        render: (props) => (
          <ToolResult {...props} threadId={session.threadId} />
        ),
      })),
    [session.threadId],
  );
  const clearError = useCallback(() => setError(''), [setError]);
  const headers = useMemo(
    () => ({ 'x-yieldex-chat-ticket': session.ticket }),
    [session.ticket],
  );
  const controls = useMemo(
    () => ({ setRunning, clearError, blocked: !!error || busy }),
    [setRunning, clearError, error, busy],
  );
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      useSingleEndpoint
      credentials="same-origin"
      headers={headers}
      enableInspector={false}
      renderToolCalls={renderers}
      messageFilter={latestUserMessage}
    >
      <ToolActivityContext.Provider value={running}>
        <PresentationContext.Provider value={controls}>
          <CopilotChat
            key={epoch}
            threadId={session.threadId}
            chatView={ChatPresentation}
            inspectorTools={false}
            onError={(event) => {
              if (
                !('error' in event) ||
                /STOPPED|dihentikan|stopped by user/i.test(event.error.message)
              )
                return;
              setRunning(false);
              setError(
                'Jawaban belum selesai atau koneksi berubah. Hubungkan ulang untuk memuat pesan yang tersimpan. Pesan tidak dikirim ulang otomatis.',
              );
            }}
            labels={{
              assistantMessageToolbarCopyMessageLabel: 'Salin jawaban',
              userMessageToolbarCopyMessageLabel: 'Salin pesan',
              chatInputPlaceholder: 'Tanyakan sesuatu tentang Yieldex…',
            }}
          />
        </PresentationContext.Provider>
      </ToolActivityContext.Provider>
    </CopilotKit>
  );
}

export function ChatbotWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [sparkMotion, setSparkMotion] = useState(true);
  const [error, setError] = useState('');
  const [sessionRecovery, setSessionRecovery] = useState<
    ChatSessionFailure['recovery'] | null
  >(null);
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false);
  const [fullHost, setFullHost] = useState<HTMLElement | null>(null);
  const [popupHost, setPopupHost] = useState<HTMLDivElement | null>(null);
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [history, setHistory] = useState<Conversation[] | null>(null);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const pending = useRef(false);
  const identityGeneration = useRef(0);
  const identityPending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const focusBefore = useRef<HTMLElement | null>(null);

  const portalRef = useRef<HTMLDivElement | null>(null);
  const mountPopup = useCallback((host: HTMLDivElement | null) => {
    setPopupHost(host);
    if (!host) return;
    if (!portalRef.current) {
      portalRef.current = document.createElement('div');
      portalRef.current.className = s.portal ?? '';
    }
    setPortalNode(portalRef.current);
  }, []);
  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );
  // A stable portal container is moved, not remounted. A streaming conversation
  // keeps the same v2 provider/agent when moving between popup and /chat.
  useLayoutEffect(() => {
    const target = fullHost ?? popupHost;
    if (portalNode && target) target.appendChild(portalNode);
  }, [portalNode, fullHost, popupHost]);
  useEffect(() => {
    if (open && !fullHost) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open, fullHost]);

  const requestSession = useCallback(
    async (
      body: Record<string, unknown>,
      force = false,
      successNotice = '',
    ) => {
      if (identityPending.current) return;
      if (pending.current && !force) return;
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      pending.current = true;
      setBusy(true);
      const generation = ++identityGeneration.current;
      setError('');
      setSessionRecovery(null);
      setNotice('');
      setHistory(null);
      setHistoryError('');
      try {
        await ensureWalletSession();
        if (
          controller.signal.aborted ||
          request.current !== controller ||
          generation !== identityGeneration.current ||
          identityPending.current
        )
          return;
        const response = await fetch('/api/assistant/session', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const data: unknown = await response.json();
        const parsed = parseChatSession(data);
        if (!response.ok) throw chatSessionFailure(data);
        if (!parsed) throw chatSessionFailure(null);
        if (
          controller.signal.aborted ||
          request.current !== controller ||
          generation !== identityGeneration.current
        )
          return;
        setSession(parsed);
        setEpoch((value) => value + 1);
        setRunning(false);
        setNotice(successNotice);
        try {
          sessionStorage.setItem(
            CHAT_STORAGE_KEY,
            JSON.stringify({ ticket: parsed.ticket }),
          );
        } catch {
          /* Storage may be disabled; in-memory session still works. */
        }
      } catch (cause) {
        if (
          !controller.signal.aborted &&
          request.current === controller &&
          generation === identityGeneration.current
        ) {
          const failure =
            cause instanceof ChatSessionFailure
              ? cause
              : chatSessionFailure(null);
          setError(failure.message);
          setSessionRecovery(failure.recovery);
        }
      } finally {
        if (request.current === controller) {
          pending.current = false;
          setBusy(false);
        }
      }
    },
    [],
  );
  const start = useCallback(() => {
    if (session || pending.current || identityPending.current) return;
    let ticket: unknown;
    try {
      ticket = JSON.parse(
        sessionStorage.getItem(CHAT_STORAGE_KEY) ?? '{}',
      ).ticket;
    } catch {
      /* New temporary session. */
    }
    void requestSession(typeof ticket === 'string' ? { ticket } : {});
  }, [session, requestSession]);
  const openAssistant = useCallback(() => {
    focusBefore.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOpen(true);
    start();
  }, [start]);
  const mountPage = useCallback(
    (host: HTMLElement | null) => setFullHost(host),
    [],
  );
  useEffect(() => {
    if (fullHost) start();
  }, [fullHost, start]);

  useEffect(() => {
    const changed = (event: Event) => {
      const detail: unknown =
        event instanceof CustomEvent
          ? event.detail
          : event instanceof MessageEvent
            ? event.data
            : null;
      const changing =
        typeof detail === 'object' &&
        detail !== null &&
        'pending' in detail &&
        detail.pending === true;
      identityPending.current = changing;
      identityGeneration.current += 1;
      request.current?.abort();
      request.current = null;
      pending.current = false;
      setBusy(changing);
      setSession(null);
      setRunning(false);
      setHistory(null);
      setError('');
      setSessionRecovery(null);
      setHistoryError('');
      try {
        sessionStorage.removeItem(CHAT_STORAGE_KEY);
      } catch {
        /* No persisted ticket. */
      }
      setNotice(
        changing
          ? 'Menyelaraskan perubahan wallet…'
          : 'Sesi wallet berubah. Percakapan sebelumnya dipisahkan dari sesi ini.',
      );
      if (!changing && (open || pathname === '/chat'))
        void requestSession({}, true);
    };
    window.addEventListener('yieldex:wallet-session-changed', changed);
    const channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('yieldex-wallet-session')
        : null;
    if (channel) channel.onmessage = changed;
    return () => {
      window.removeEventListener('yieldex:wallet-session-changed', changed);
      channel?.close();
    };
  }, [open, pathname, requestSession]);
  const close = () => {
    setOpen(false);
    dialog.current?.close();
    focusBefore.current?.focus();
  };
  const beginNew = (persistence: 'TEMPORARY' | 'SAVED') => {
    if (running || busy) return;
    void requestSession(
      persistence === 'SAVED' ? { persistence } : {},
      false,
      persistence === 'SAVED'
        ? 'Percakapan tersimpan baru. Pesan dari chat sementara tidak disalin.'
        : 'Percakapan sementara baru.',
    );
  };
  const loadHistory = async () => {
    if (historyLoading) return;
    setHistoryLoading(true);
    setHistoryError('');
    const generation = identityGeneration.current;
    try {
      const response = await fetch('/api/v1/conversations', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const result = validateData(
        'api.ConversationsPage',
        await response.json(),
      );
      if (!response.ok || !result.success)
        throw new Error('HISTORY_UNAVAILABLE');
      if (generation === identityGeneration.current)
        setHistory(result.data.items);
    } catch {
      if (generation === identityGeneration.current)
        setHistoryError(
          'Riwayat belum dapat dimuat. Coba lagi setelah wallet terhubung.',
        );
    } finally {
      setHistoryLoading(false);
    }
  };
  const panel = (
    <section
      className={s.panel}
      aria-label="Yieldex Assistant"
      data-assistant-surface={fullHost ? 'page' : 'popup'}
    >
      <header className={s.panelHeader}>
        <div className={s.panelIdentity}>
          <span className={s.avatar} aria-hidden="true">
            <Icon name="sparkles" inheritColor size={19} />
          </span>
          <div>
            <h1>Yieldex Assistant</h1>
            <p>
              {session?.persistence === 'SAVED'
                ? 'Tersimpan di akun wallet'
                : session
                  ? 'Chat sementara · data dari platform'
                  : 'Data dari platform · konfirmasi transaksi di wallet'}
            </p>
          </div>
        </div>
        <div className={s.panelActions}>
          {!fullHost && (
            <Link
              href="/chat"
              aria-label="Buka chat halaman penuh"
              onClick={() => setOpen(false)}
            >
              <Icon name="arrow-up-right" alt="" size={18} />
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={running || busy}
            onClick={() => beginNew('TEMPORARY')}
            aria-label="Mulai chat baru"
          >
            <Icon name="plus" size={17} alt="" />
          </Button>
          {!fullHost && (
            <Button
              variant="ghost"
              size="sm"
              onClick={close}
              aria-label="Tutup chat"
            >
              <Icon name="x" size={18} alt="" />
            </Button>
          )}
        </div>
      </header>
      <div className={s.sessionBar}>
        {session?.authenticated ? (
          <>
            <button
              disabled={running || busy}
              onClick={() => beginNew('SAVED')}
            >
              Mulai chat tersimpan
            </button>
            <button
              disabled={running || busy || historyLoading}
              onClick={() => {
                if (history !== null) setHistory(null);
                else void loadHistory();
              }}
            >
              {historyLoading ? 'Memuat…' : 'Riwayat tersimpan'}
            </button>
          </>
        ) : session ? (
          <Link href="/wallet?returnTo=/chat" onClick={() => setOpen(false)}>
            Verifikasi wallet untuk menyimpan chat{' '}
            <Icon name="arrow-up-right" alt="" size={13} />
          </Link>
        ) : (
          <span>
            {busy ? 'Memeriksa sesi chat…' : 'Sesi chat belum tersedia'}
          </span>
        )}
        <span>AI tidak mengirim transaksi</span>
      </div>
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {historyError && (
        <p className={s.error} role="alert">
          {historyError}
        </p>
      )}
      {history !== null && (
        <nav className={s.history} aria-label="Percakapan tersimpan">
          {history.length ? (
            history.map((item) => (
              <button
                key={item.conversationId}
                disabled={running || busy}
                onClick={() => {
                  void requestSession(
                    {
                      persistence: 'SAVED',
                      conversationId: item.conversationId,
                    },
                    false,
                    'Percakapan tersimpan milik wallet ini.',
                  );
                }}
              >
                <span>{item.title}</span>
                <small>
                  {new Date(item.updatedAt * 1000).toLocaleDateString('id-ID')}
                </small>
              </button>
            ))
          ) : (
            <p>Belum ada percakapan tersimpan.</p>
          )}
        </nav>
      )}
      {error && (
        <div className={s.error} role="alert">
          <p>{error}</p>
          <div>
            {(sessionRecovery === null || sessionRecovery === 'retry') && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setError('');
                  setRunning(false);
                  if (session) void requestSession({ ticket: session.ticket });
                  else start();
                }}
              >
                Coba lagi
              </Button>
            )}
            {sessionRecovery === 'verify' && (
              <Link
                href="/wallet?returnTo=/chat"
                onClick={() => setOpen(false)}
              >
                Verifikasi wallet
              </Link>
            )}
            {sessionRecovery !== 'retry' && (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy || running}
                onClick={() => beginNew('TEMPORARY')}
              >
                Chat baru
              </Button>
            )}
          </div>
        </div>
      )}
      {busy && (
        <p className={s.connectionStatus} role="status">
          Menyiapkan sesi aman…
        </p>
      )}
      {session && !busy ? (
        <ChatRuntime
          key={session.threadId}
          session={session}
          error={error}
          setError={setError}
          setRunning={setRunning}
          epoch={epoch}
          running={running}
          busy={busy}
        />
      ) : (
        <div className={s.sessionEmpty}>
          <Icon name="sparkles" inheritColor size={28} />
          <p>
            {busy
              ? 'Menghubungkan Yieldex Assistant'
              : 'Tanyakan tentang penawaran, aset, dan quote.'}
          </p>
        </div>
      )}
    </section>
  );
  return (
    <AssistantContext.Provider value={{ open: openAssistant, busy, mountPage }}>
      {children}
      <dialog
        ref={dialog}
        className={s.popup}
        aria-label="Yieldex Assistant"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => setOpen(false)}
      >
        <div ref={mountPopup} className={s.popupHost} />
      </dialog>
      {portalNode && createPortal(panel, portalNode)}
      {!fullHost && !open && (
        <aside className={s.launcher}>
          <button
            type="button"
            className={s.chatBubble}
            data-motion={sparkMotion && !busy ? 'on' : 'off'}
            aria-label={busy ? 'Membuka chat…' : 'Tanya Yieldex Assistant'}
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={openAssistant}
          >
            <span className={s.bubbleHint}>
              {busy ? 'Membuka chat…' : 'Tanya Yieldex'}
            </span>
            <svg
              className={s.bubbleFace}
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
              <g className={s.bubbleEyes}>
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
            <span className={s.fairyOrbit} aria-hidden="true">
              <span>✦</span>
            </span>
            <span
              className={`${s.fairyOrbit} ${s.fairySecond}`}
              aria-hidden="true"
            >
              <span>✧</span>
            </span>
          </button>
          <button
            type="button"
            className={s.motionToggle}
            onClick={() => setSparkMotion((value) => !value)}
            aria-label={
              sparkMotion ? 'Jeda animasi bubble' : 'Aktifkan animasi bubble'
            }
            aria-pressed={!sparkMotion}
          >
            {sparkMotion ? 'Ⅱ' : '▷'}
          </button>
        </aside>
      )}
    </AssistantContext.Provider>
  );
}
