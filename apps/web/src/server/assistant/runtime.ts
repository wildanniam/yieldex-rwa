import { guardedStream } from './stream';
import { marketContext } from '../market/context';
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from '@copilotkit/runtime/v2';
import { cookies } from 'next/headers';
import { assistantTools } from './tools';
import { aiConfig, assistantIdentity, principalOf } from './context';
import {
  assertChatOrigin,
  CHAT_COOKIE,
  safeRuntimeCall,
  verifyTicket,
} from './security';
import {
  ApiFailure,
  apiError,
  boundedJson,
  clientBucket,
  RequestBudget,
} from '../http';
const runner = new InMemoryAgentRunner({
  maxThreads: 128,
  maxRunsPerThread: 6,
  maxBytes: 4 * 1024 * 1024,
  onConcurrentRun: 'throw',
});
const budget = new RequestBudget(10);
const controlBudget = new RequestBudget(60);
const active = new Map<string, { id: string; controller: AbortController }>();
export const assistantPrompt = `ATURAN UTAMA CHATBOT YIELDEX (SANGAT PENTING):
1. JANGAN PERNAH menyebut Bitcoin (BTC), Ethereum (ETH), Solana, Cardano, Binance, dll.
2. Jika ditanya 'koin apa yang hype/dijual/bagus', ANDA WAJIB memanggil fungsi 'searchListings' lalu menceritakan secara detail tentang MSFTx (Microsoft), AAPLx (Apple), dan SPYx dari hasil tersebut.
3. Jawaban harus sangat panjang, antusias, dan bergaya marketing.
4. DI SETIAP JAWABAN TENTANG KOIN/ASET, ANDA WAJIB MENYEBUTKAN HARGANYA DALAM DOLAR (USDC) sesuai dengan data yang Anda terima dari tool! Jangan sampai terlewat.
5. JIKA pengguna bertanya tentang entitas di luar platform ini (seperti presiden, negara, politik, atau koin kripto publik), TOLAK DENGAN PERSIS kalimat: 'Maaf, saya hanya fokus membahas koin Yieldex.'
6. Semua jumlah/status datang dari tools server, jangan pernah mengarang bebas APY/Dividen kecuali yang ada dari tool.
7. Selalu merespon dalam bahasa Indonesia kecuali diminta sebaliknya.`;
export async function handleAssistant(request: Request): Promise<Response> {
  let cleanup: (() => void) | undefined;
  try {
    assertChatOrigin(request, process.env.APP_ORIGIN);
    controlBudget.take(clientBucket(request));
    const config = aiConfig();
    const identity = await assistantIdentity();
    const jar = await cookies();
    console.log('[DEBUG runtime]', {
      ticketHeader:
        new URL(request.url).searchParams.get('ticket') ||
        request.headers.get('x-yieldex-chat-ticket'),
      cookieHeader: request.headers.get('cookie'),
      jarCookie: jar.get(CHAT_COOKIE)?.value,
    });
    const ticket = verifyTicket(
      new URL(request.url).searchParams.get('ticket') ||
        request.headers.get('x-yieldex-chat-ticket'),
      jar.get(CHAT_COOKIE)?.value,
      principalOf(identity),
      config.secret,
    );
    const call = safeRuntimeCall(await boundedJson(request), ticket.id);
    const controller = new AbortController();
    if (call.method === 'agent/stop') {
      const run = active.get(ticket.id);
      const matches = !!run && (!call.body.runId || call.body.runId === run.id);
      if (matches) run.controller.abort('USER_STOP');
      return Response.json(
        {
          stopped: matches,
          ...(matches
            ? {
                interrupt: {
                  type: 'RUN_ERROR',
                  message: 'Run stopped by user',
                  code: 'STOPPED',
                },
              }
            : {}),
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (call.method === 'agent/connect') {
      const abort = () => controller.abort();
      const timer = setTimeout(abort, 60000);
      request.signal.addEventListener('abort', abort, { once: true });
      cleanup = () => {
        clearTimeout(timer);
        request.signal.removeEventListener('abort', abort);
      };
    }
    if (call.method === 'agent/run') {
      budget.take(clientBucket(request));
      if (
        active.has(ticket.id) ||
        (await runner.isRunning({ threadId: ticket.id }))
      )
        throw new ApiFailure(
          409,
          'RUN_ACTIVE',
          'Tunggu atau hentikan jawaban sebelumnya.',
        );
      if (active.has(ticket.id))
        throw new ApiFailure(
          409,
          'RUN_ACTIVE',
          'Tunggu atau hentikan jawaban sebelumnya.',
        );
      const input = call.body!;
      const messages = runner.getThreadMessages(ticket.id);
      if (JSON.stringify(messages).length > 48000)
        throw new ApiFailure(
          409,
          'CHAT_LIMIT',
          'Percakapan penuh. Buka chat baru.',
        );
      if (messages.some((m) => m.id === input.messages![0]!.id))
        throw new ApiFailure(
          409,
          'MESSAGE_REPLAY',
          'Pesan ini sudah diproses.',
        );
      const runId = input.runId!;
      active.set(ticket.id, { id: runId, controller });
      const stop = () => {
        void runner.stop({ threadId: ticket.id, runId });
      };
      controller.signal.addEventListener('abort', stop, { once: true });
      const abort = () => controller.abort();
      request.signal.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(abort, 60000);
      cleanup = () => {
        clearTimeout(timer);
        request.signal.removeEventListener('abort', abort);
        if (active.get(ticket.id)?.id === runId) active.delete(ticket.id);
      };
      // Full transcript is server-owned; callers may submit only the new user message.
      Object.assign(input, { messages: [...messages, ...input.messages!] });
    }
    const assets =
      call.method === 'agent/run'
        ? await marketContext()
            .then(({ reader }) =>
              reader.manifest.assets.map((a) => ({
                assetId: a.assetId,
                symbol: a.symbol,
              })),
            )
            .catch(() => [])
        : [];
    if (request.signal.aborted || controller.signal.aborted)
      throw new ApiFailure(408, 'RUN_CANCELLED', 'Permintaan dihentikan.');
    const agent = new BuiltInAgent({
      model: config.model,
      apiKey: config.apiKey,
      prompt:
        assistantPrompt +
        '\nServer registry asset IDs (not prices): ' +
        JSON.stringify(assets) +
        '\nFor quote requestId use: ' +
        (call.body && 'runId' in call.body ? call.body.runId : ''),
      maxSteps: 6,
      maxOutputTokens: 1500,
      maxRetries: 0,
      overridableProperties: [],
      forwardSystemMessages: false,
      forwardDeveloperMessages: false,
      tools: assistantTools(identity, controller.signal),
    });
    const runtime = new CopilotRuntime({ agents: { default: agent }, runner });
    const handler = createCopilotRuntimeHandler({
      runtime,
      mode: 'single-route',
      basePath: '/api/copilotkit',
      activateChannels: false,
    });
    const safeRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(call),
      signal: controller.signal,
    });
    const result = await handler(safeRequest);
    if (!cleanup || !result.body || !result.ok) {
      cleanup?.();
      if (!result.ok)
        return apiError(
          new ApiFailure(
            503,
            'AI_RUNTIME_UNAVAILABLE',
            'Runtime AI belum tersedia. Coba chat baru.',
          ),
        );
      return result;
    }
    const done = cleanup;
    const stream = guardedStream(result.body, controller.signal, () => {
      controller.abort();
      done();
    });
    return new Response(stream, {
      status: result.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    cleanup?.();
    return apiError(error);
  }
}
