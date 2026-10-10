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
it('does not publish RUN_FINISHED until durable checkpoint succeeds', async () => {
  let release: () => void = () => {};
  const checkpoint = new Promise<void>((resolve) => {
    release = resolve;
  });
  const source = new ReadableStream<Uint8Array>({
    start(s) {
      s.enqueue(bytes('data: {"type":"RUN_FINISHED","runId":"run"}\n\n'));
      s.close();
    },
  });
  const result = new Response(
    guardedStream(source, new AbortController().signal, () => checkpoint),
  ).text();
  let done = false;
  void result.then(() => {
    done = true;
  });
  await Promise.resolve();
  expect(done).toBe(false);
  release();
  expect(await result).toContain('RUN_FINISHED');
});
it('replaces successful terminal event with a recoverable error if persistence fails', async () => {
  const source = new ReadableStream<Uint8Array>({
    start(s) {
      s.enqueue(bytes('data: {"type":"RUN_FINISHED"}\n\n'));
      s.close();
    },
  });
  const result = await new Response(
    guardedStream(source, new AbortController().signal, async () => {
      throw new Error('postgres://private');
    }),
  ).text();
  expect(result).toContain('AI_STATE_UNAVAILABLE');
  expect(result).not.toMatch(/RUN_FINISHED|postgres/);
});
it('handles client disconnect during checkpoint without duplicate save or writing to a closed stream', async () => {
  let release: () => void = () => {};
  const checkpoint = new Promise<void>((resolve) => {
    release = resolve;
  });
  const save = vi.fn(() => checkpoint);
  const source = new ReadableStream<Uint8Array>({
    start(s) {
      s.enqueue(bytes('data: {"type":"RUN_FINISHED"}\n\n'));
      s.close();
    },
  });
  const stream = guardedStream(source, new AbortController().signal, save);
  const reader = stream.getReader();
  const pending = reader.read();
  await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
  const cancel = reader.cancel();
  release();
  await cancel;
  await pending;
  expect(save).toHaveBeenCalledOnce();
});

it('flushes final safe narration before checkpoint, then emits the terminal event', async () => {
  const order: string[] = [];
  const source = new ReadableStream<Uint8Array>({
    start(s) {
      s.enqueue(
        bytes(
          'data: {"type":"TEXT_MESSAGE_CONTENT","delta":"false quote"}\n\ndata: {"type":"RUN_FINISHED"}\n\n',
        ),
      );
      s.close();
    },
  });
  const result = await new Response(
    guardedStream(
      source,
      new AbortController().signal,
      () => {
        order.push('checkpoint');
      },
      (event) => (event.type === 'TEXT_MESSAGE_CONTENT' ? [] : [event]),
      (completed) => {
        expect(completed).toBe(true);
        order.push('safe transcript');
        return [
          {
            type: 'TEXT_MESSAGE_CONTENT',
            messageId: 'grounded',
            delta: 'Validated explanation',
          },
        ];
      },
    ),
  ).text();
  expect(order).toEqual(['safe transcript', 'checkpoint']);
  expect(result).not.toContain('false quote');
  expect(result.indexOf('Validated explanation')).toBeLessThan(
    result.indexOf('RUN_FINISHED'),
  );
});

it('treats EOF without a terminal event as incomplete and flushes only once before saving', async () => {
  const finish = vi.fn(),
    flush = vi.fn(() => []);
  const source = new ReadableStream<Uint8Array>({
    start(s) {
      s.close();
    },
  });
  const result = await new Response(
    guardedStream(
      source,
      new AbortController().signal,
      finish,
      undefined,
      flush,
    ),
  ).text();
  expect(result).toContain('AI_RUN_INTERRUPTED');
  expect(result).not.toContain('RUN_FINISHED');
  expect(flush).toHaveBeenCalledExactlyOnceWith(false);
  expect(finish).toHaveBeenCalledOnce();
});
