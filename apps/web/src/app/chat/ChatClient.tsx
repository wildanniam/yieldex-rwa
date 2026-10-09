'use client';
import * as React from 'react';
import { CopilotKit, useCopilotChat } from '@copilotkit/react-core';
import { TextMessage, MessageRole } from '@copilotkit/runtime-client-gql';
import { ToolResult } from '@/features/assistant/cards';
import { Icon } from '@/components/ui/icon';

type ChatSession = { threadId: string; ticket: string; authenticated: boolean };

// ---------------- UI CARDS ----------------
function ListingComparisonCard({ data }: { data: any }) {
  if (!data?.listings) return null;

  return (
    <div className="bg-[#080E10] p-4 sm:p-5 rounded-2xl border border-[#20282C] my-3 shadow-sm font-sans w-full text-left">
      <h4 className="m-0 mb-4 text-[15px] font-semibold text-text-1 border-b border-[#272E31] pb-3 tracking-wide">
        Market Listings
      </h4>

      <div className="flex flex-col gap-3">
        {data.listings.map((l: any, i: number) => (
          <div
            key={i}
            className="p-4 bg-[#101416] rounded-xl border border-[#272E31] text-[13px] transition-colors duration-200 hover:border-[#3B5144]"
          >
            <div className="flex justify-between items-center gap-3 mb-4">
              <strong className="text-green-1 text-[15px] font-semibold">
                {l.asset}
              </strong>

              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-green-1/10 text-green-1 border border-[#293A30]">
                {l.type}
              </span>
            </div>

            <div className="flex justify-between items-center gap-4 mb-3">
              <span className="text-text-2">Harga</span>
              <span className="font-semibold text-text-1 text-[15px]">
                {l.price}
              </span>
            </div>

            <div className="flex justify-between items-center gap-4 mb-3">
              <span className="text-text-2">Income BPS</span>
              <span className="text-text-1">{l.incomeBps}</span>
            </div>

            <div className="flex justify-between items-center gap-4 mb-3">
              <span className="text-text-2">Durasi</span>
              <span className="text-text-1">{l.duration}</span>
            </div>

            <div className="flex justify-between items-center gap-4 pt-3 border-t border-[#272E31]">
              <span className="text-text-2">Status</span>
              <span className="text-text-1 text-right">{l.freshness}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetContextCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="bg-[#101416] p-4 rounded-xl border border-[#272E31] my-3 shadow-sm font-sans w-full text-left">
      <h4 className="m-0 mb-3 text-[15px] font-semibold text-text-1 border-b border-[#272E31] pb-2">
        Asset Profile
      </h4>
      <div className="flex flex-col gap-2 text-[13px] text-text-2">
        <div className="flex justify-between">
          <span>Asset ID</span>
          <span className="font-semibold text-text-1">{data.assetId}</span>
        </div>
        <div className="flex justify-between">
          <span>Issuer</span>
          <span className="font-semibold text-text-1">{data.issuer}</span>
        </div>
        <div className="flex justify-between">
          <span>Payout</span>
          <span className="font-semibold text-text-1">{data.payout}</span>
        </div>
        <div className="flex justify-between">
          <span>Risk Level</span>
          <span className="font-semibold text-red-400">{data.risk}</span>
        </div>
      </div>
    </div>
  );
}

function QuoteComparisonCard({ data }: { data: any }) {
  if (!data?.routes) return null;
  return (
    <div className="bg-[#101416] p-4 rounded-xl border border-[#272E31] my-3 shadow-sm font-sans w-full text-left">
      <div className="flex justify-between items-center mb-3 border-b border-[#272E31] pb-2">
        <h4 className="m-0 text-[15px] font-semibold text-text-1">
          Quote Comparison
        </h4>
        <span className="text-[11px] font-semibold text-green-1 px-2 py-0.5 rounded bg-green-1/10">
          {data.rankingStatus}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {data.routes.map((r: any, i: number) => {
          const isBest = r.chain === data.recommendedChain;
          return (
            <div
              key={i}
              className="p-3 bg-[#1A1F21] rounded-lg border border-[#272E31] text-[13px]"
            >
              <div className="flex justify-between mb-1">
                <strong className={isBest ? 'text-green-1' : 'text-text-1'}>
                  {r.chain}
                </strong>
                {isBest && (
                  <span className="text-green-1 text-[11px] font-semibold">
                    Best Route
                  </span>
                )}
              </div>
              <div className="flex justify-between text-text-2">
                <span>
                  Output:{' '}
                  <span className="font-semibold text-text-1">
                    {r.expectedOut}
                  </span>
                </span>
                <span>Fee: {r.fee}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PurchasePreviewCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="bg-[#101416] p-4 rounded-xl border border-[#272E31] my-3 shadow-sm font-sans w-full text-left">
      <h4 className="m-0 mb-3 text-[15px] font-semibold text-text-1 border-b border-[#272E31] pb-2">
        Purchase Preview
      </h4>
      <div className="flex flex-col gap-2 text-[13px] text-text-2 mb-4">
        <div className="flex justify-between">
          <span>Listing ID</span>
          <span className="font-semibold text-text-1">{data.listingKey}</span>
        </div>
        <div className="flex justify-between">
          <span>Payment Token</span>
          <span className="font-semibold text-text-1">{data.paymentToken}</span>
        </div>
      </div>
      <button
        disabled
        className="w-full bg-[#1A1F21] text-text-2 border border-[#272E31] px-4 py-2.5 rounded-lg text-[13px] font-semibold cursor-not-allowed text-center"
      >
        Proceed to Wallet (Demo)
      </button>
    </div>
  );
}

function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const isHeader = line.trim().startsWith('### ');
    const rawLine = isHeader ? line.replace('### ', '') : line;

    // Split by bold (**text**)
    const parts = rawLine.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={j} className="font-bold text-text-1">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={j}>{part}</span>;
    });

    if (isHeader) {
      return (
        <div
          key={i}
          className="font-semibold text-[17px] text-text-1 mt-4 mb-2"
        >
          {renderedLine}
        </div>
      );
    }

    return (
      <div key={i} className="mb-2 last:mb-0 min-h-[1.2rem]">
        {renderedLine}
      </div>
    );
  });
}

function ChatInner({ session }: { session: ChatSession }) {
  const [isFetching, setIsFetching] = React.useState(false);
  const { visibleMessages, appendMessage, isLoading } = useCopilotChat();
  const [localMessages, setLocalMessages] = React.useState<any[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content:
        'Halo! Saya asisten pintar Yieldex. Ada yang bisa saya bantu hari ini? Anda bisa menanyakan daftar aset RWA, perbandingan harga koin, atau detail pendapatan dividen dari aset yang ada di platform kami.',
      createdAt: Date.now(),
    },
  ]);

  // Gunakan localMessages secara penuh karena kita melakukan manual SSE fetch
  const messages = localMessages;

  const [input, setInput] = React.useState('');
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isFetching) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      createdAt: Date.now(),
      content: input,
    };

    // Langsung tampilkan di UI agar tidak hilang
    const newMessages = [...messages, userMsg];
    setLocalMessages(newMessages);
    setInput('');
    setIsFetching(true);

    try {
      const res = await fetch('/api/copilotkit?ticket=' + session.ticket, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'agent/run',
          params: { agentId: 'default', threadId: session.threadId },
          body: {
            runId:
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString(),
            messages: [
              { id: userMsg.id, role: userMsg.role, content: userMsg.content },
            ],
          },
        }),
      });

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'TEXT_MESSAGE_START') {
                  setLocalMessages((prev) => [
                    ...prev,
                    {
                      id: data.messageId,
                      role: data.role,
                      content: '',
                      createdAt: Date.now(),
                    },
                  ]);
                } else if (data.type === 'TEXT_MESSAGE_CONTENT') {
                  setLocalMessages((prev) =>
                    prev.map((m) =>
                      m.id === data.messageId
                        ? { ...m, content: m.content + data.delta }
                        : m,
                    ),
                  );
                } else if (
                  data.type === 'ACTION_EXECUTION_START' ||
                  data.type === 'TOOL_CALL_START'
                ) {
                  const id = data.actionExecutionId || data.toolCallId;
                  const name = data.actionName || data.toolCallName;
                  setLocalMessages((prev) => [
                    ...prev,
                    {
                      id,
                      role: 'function',
                      name,
                      arguments: '',
                      createdAt: Date.now(),
                    },
                  ]);
                } else if (
                  data.type === 'ACTION_EXECUTION_ARGS' ||
                  data.type === 'TOOL_CALL_ARGS'
                ) {
                  const id = data.actionExecutionId || data.toolCallId;
                  const args = data.args || data.delta || '';
                  setLocalMessages((prev) =>
                    prev.map((m) =>
                      m.id === id ? { ...m, arguments: m.arguments + args } : m,
                    ),
                  );
                } else if (
                  data.type === 'ACTION_EXECUTION_RESULT' ||
                  data.type === 'TOOL_CALL_RESULT'
                ) {
                  const id = data.actionExecutionId || data.toolCallId;
                  setLocalMessages((prev) => {
                    const toolCallMsg = prev.find(
                      (m) => m.id === id && m.role === 'function',
                    );
                    const name =
                      data.actionName ||
                      data.toolName ||
                      (toolCallMsg ? toolCallMsg.name : 'unknown_tool');
                    const resultData = data.result || data.content;
                    return [
                      ...prev,
                      {
                        id: id + '_result',
                        role: 'tool_result',
                        name,
                        result: resultData,
                        createdAt: Date.now(),
                      },
                    ];
                  });
                }
              } catch (e) {
                // ignore JSON parse error for partial lines
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Gagal fetch:', err);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-h-screen bg-canvas">
      {/* Main Content */}
      <main className="flex-1 p-8 pt-4 pb-12 overflow-hidden flex flex-col">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col rounded-[25px] border border-border bg-[#02080E] p-8 overflow-hidden mx-auto w-full max-w-5xl">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-4 pb-4">
            <div className="text-white text-xs opacity-50">
              Debug Messages: {messages.length}
            </div>

            {messages.map((msg, idx) => {
              // @ts-ignore
              const isUser = msg.role === 'user';
              const m: any = msg;

              if (m.role === 'function' && !m.result) {
                const toolName =
                  m.name || (m.function_call && m.function_call.name);
                const hasResult = messages.some(
                  (res: any) =>
                    res.role === 'tool_result' && res.id === m.id + '_result',
                );
                if (hasResult) return null;

                return (
                  <div key={idx} className="self-start max-w-[75%] mb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-1">
                        <Icon
                          name="sparkles"
                          className="h-5 w-5 text-card"
                          inheritColor
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="rounded-[20px] rounded-tl-[4px] bg-[#101416] p-4 text-[13px] text-text-2 shadow-sm border border-[#272E31] flex items-center gap-2">
                          <Icon name="clock" className="h-4 w-4 animate-spin" />
                          <span>Mengeksekusi {toolName}...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (m.role === 'tool_result') {
                const toolName = m.name;
                let parsedResult = m.result;
                if (typeof parsedResult === 'string') {
                  try {
                    parsedResult = JSON.parse(parsedResult);
                  } catch (e) {}
                }

                let CardComponent = null;
                if (toolName === 'searchListings') {
                  CardComponent = <ListingComparisonCard data={parsedResult} />;
                } else if (toolName === 'getAssetContext') {
                  CardComponent = <AssetContextCard data={parsedResult} />;
                } else if (toolName === 'getPaymentQuotes') {
                  CardComponent = <QuoteComparisonCard data={parsedResult} />;
                } else if (toolName === 'preparePurchase') {
                  CardComponent = <PurchasePreviewCard data={parsedResult} />;
                }

                if (!CardComponent) return null;

                return (
                  <div key={idx} className="self-start w-full max-w-[85%] mb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-1">
                        <Icon
                          name="sparkles"
                          className="h-5 w-5 text-card"
                          inheritColor
                        />
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        {CardComponent}
                      </div>
                    </div>
                  </div>
                );
              }

              const isToolCall =
                m.function_call ||
                (m.name && m.role !== 'tool_result' && m.role !== 'function');
              if (isToolCall && !isUser) return null;

              return (
                <div
                  key={idx}
                  className={`flex max-w-[75%] ${isUser ? 'self-end' : 'self-start'}`}
                >
                  {!isUser && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-1 mr-4 mt-1 text-primary-label">
                      <Icon name="sparkles" className="h-5 w-5" inheritColor />
                    </div>
                  )}

                  <div
                    className={`rounded-[18px] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm flex flex-col ${
                      isUser
                        ? 'bg-[#823BFA] text-white'
                        : 'bg-[#101416] text-text-1 border border-[#272E31]'
                    }`}
                  >
                    {/* @ts-ignore */}
                    {isUser ? msg.content : renderMarkdown(msg.content)}
                  </div>
                </div>
              );
            })}
            {isFetching && (
              <div className="self-start flex gap-4 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-1 text-primary-label">
                  <Icon name="sparkles" className="h-5 w-5" inheritColor />
                </div>
                <div className="rounded-[18px] bg-[#101416] border border-[#272E31] px-5 py-3.5 text-text-2 flex items-center shadow-sm">
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="mt-4 pt-4 shrink-0 border-t border-border/50">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Cari penawaran atau bandingkan quote?"
                className="w-full rounded-full border border-[#272E31] bg-[#101416] py-[18px] pl-6 pr-16 text-[15px] text-text-1 placeholder:text-text-2 focus:outline-none focus:ring-1 focus:ring-green-1 shadow-inner"
                disabled={isFetching}
              />
              <button
                type="submit"
                disabled={!input.trim() || isFetching}
                className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#8BE39A] to-[#55B963] text-primary-label transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Icon name="arrow-right" className="h-5 w-5" inheritColor />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ChatClient() {
  const [session, setSession] = React.useState<ChatSession | null>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    async function start() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const resetParam = urlParams.get('reset') === '1' ? '?reset=true' : '';
        const response = await fetch(`/api/assistant/session${resetParam}`, {
          method: 'POST',
          credentials: 'same-origin',
        });
        const data = await response.json();
        if (
          !response.ok ||
          typeof data.threadId !== 'string' ||
          typeof data.ticket !== 'string'
        ) {
          throw new Error('Chat session failed');
        }
        if (mounted) {
          setSession(data);
          if (resetParam) window.history.replaceState({}, '', '/chat');
        }
      } catch (err) {
        if (mounted) setError('Gagal memulai sesi AI Assistant.');
      }
    }
    start();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-text-1">
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center text-text-1">
        Menyiapkan Yieldex Assistant...
      </div>
    );
  }

  return (
    <CopilotKit
      runtimeUrl={'/api/copilotkit?ticket=' + session.ticket}
      useSingleEndpoint
      credentials="same-origin"
      headers={{ 'x-yieldex-chat-ticket': session.ticket }}
      enableInspector={false}
    >
      <ChatInner session={session} />
    </CopilotKit>
  );
}
