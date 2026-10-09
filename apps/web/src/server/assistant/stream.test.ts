import { expect, it, vi } from 'vitest';
import { guardedStream } from './stream';
const bytes = (s: string) => new TextEncoder().encode(s);
it('joins split SSE frames and hides provider error details and raw events', async () => {
  const c = new AbortController(),
    done = vi.fn();
  const source = new ReadableStream<Uint8Array>({
    start(s) {
      s.enqueue(
        bytes(
          'data: {"type":"TEXT_MESSAGE_CONTENT","delta":"ok","rawEvent":{"secret":"hidden"}}\n',
        ),
      );
      s.enqueue(
        bytes(
          '\ndata: {"type":"RUN_ERROR","message":"sk-secret postgres://private"}\n\n',
        ),
      );
      s.close();
    },
  });
  const text = await new Response(guardedStream(source, c.signal, done)).text();
  expect(text).toContain('"delta":"ok"');
  expect(text).toContain('AI_RUN_INTERRUPTED');
  expect(text).not.toMatch(/sk-secret|postgres:|hidden|rawEvent/);
  expect(done).toHaveBeenCalledOnce();
});
it('ends a never-ending upstream on abort and releases the run exactly once', async () => {
  const c = new AbortController(),
    done = vi.fn(),
    cancel = vi.fn();
  const source = new ReadableStream<Uint8Array>({ cancel });
  const result = new Response(guardedStream(source, c.signal, done)).text();
  c.abort();
  expect(await result).toContain('RUN_ERROR');
  expect(cancel).toHaveBeenCalledOnce();
  expect(done).toHaveBeenCalledOnce();
});
it('terminates malformed provider events without rendering them', async () => {
  const c = new AbortController(),
    done = vi.fn();
  const source = new ReadableStream<Uint8Array>({
    start(s) {
      s.enqueue(bytes('data: <script>leak()</script>\n\n'));
    },
  });
  const result = await new Response(
    guardedStream(source, c.signal, done),
  ).text();
  expect(result).not.toContain('<script>');
  expect(result).toContain('AI_RUN_INTERRUPTED');
  expect(done).toHaveBeenCalledOnce();
});
