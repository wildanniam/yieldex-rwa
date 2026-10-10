/** Fence upstream SSE errors and enforce a terminal abort even if the runtime keeps its stream open. */
export function guardedStream(
  source: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  finish: () => void | Promise<void>,
  onEvent?: (
    event: Record<string, unknown>,
  ) => Record<string, unknown>[] | void,
  onEnd?: (completed: boolean) => Record<string, unknown>[],
) {
  const reader = source.getReader();
  const encoder = new TextEncoder(),
    decoder = new TextDecoder();
  let ended = false,
    buffered = '',
    bytes = 0;
  let terminal: Uint8Array | undefined;
  let completed = false;
  let flushed: Record<string, unknown>[] | undefined;
  const flushOnce = () =>
    (flushed ??= onEnd?.(completed && !signal.aborted) ?? []);
  let cancelled = false;
  let finishing: Promise<void> | undefined;
  let detach = () => {};
  const finishOnce = () =>
    (finishing ??= (async () => {
      await finish();
    })());
  const failure = () =>
    encoder.encode(
      'data: ' +
        JSON.stringify({
          type: 'RUN_ERROR',
          message:
            signal.reason === 'USER_STOP'
              ? 'Permintaan dihentikan.'
              : 'Jawaban terputus atau melewati batas waktu. Coba chat baru.',
          code:
            signal.reason === 'USER_STOP' ? 'STOPPED' : 'AI_RUN_INTERRUPTED',
        }) +
        '\n\n',
    );
  return new ReadableStream<Uint8Array>({
    start(target) {
      const end = async () => {
        if (ended) return;
        ended = true;
        signal.removeEventListener('abort', abort);
        try {
          for (const event of flushOnce())
            if (!cancelled)
              target.enqueue(
                encoder.encode('data: ' + JSON.stringify(event) + '\n\n'),
              );
          await finishOnce();
          if (!cancelled && terminal) target.enqueue(terminal);
        } catch {
          if (!cancelled)
            target.enqueue(
              encoder.encode(
                'data: ' +
                  JSON.stringify({
                    type: 'RUN_ERROR',
                    code: 'AI_STATE_UNAVAILABLE',
                    message:
                      'Jawaban belum tersimpan. Pulihkan chat sebelum mengirim lagi.',
                  }) +
                  '\n\n',
              ),
            );
        }
        if (!cancelled) target.close();
      };
      const abort = () => {
        if (ended) return;
        completed = false;
        terminal = failure();
        void reader.cancel().catch(() => {});
        end();
      };
      detach = () => signal.removeEventListener('abort', abort);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) {
        abort();
        return;
      }
      void (async () => {
        try {
          for (;;) {
            const part = await reader.read();
            if (ended) return;
            if (part.done) {
              terminal ??= failure();
              end();
              return;
            }
            bytes += part.value.length;
            if (bytes > 1024 * 1024) {
              abort();
              return;
            }
            buffered += decoder
              .decode(part.value, { stream: true })
              .replace(/\r\n/g, '\n');
            let split: number;
            while ((split = buffered.indexOf('\n\n')) >= 0) {
              const frame = buffered.slice(0, split);
              buffered = buffered.slice(split + 2);
              const data = frame
                .split('\n')
                .filter((l) => l.startsWith('data:'))
                .map((l) => l.slice(5).trim())
                .join('\n');
              if (!data) {
                target.enqueue(encoder.encode(frame + '\n\n'));
                continue;
              }
              try {
                const event = JSON.parse(data);
                delete event.rawEvent;
                const output = onEvent?.(event) ?? [event];
                for (const next of output) {
                  if (next.type === 'RUN_ERROR') {
                    terminal = failure();
                    completed = false;
                    void reader.cancel().catch(() => {});
                    end();
                    return;
                  }
                  delete next.rawEvent;
                  const frame = encoder.encode(
                    'data: ' + JSON.stringify(next) + '\n\n',
                  );
                  if (next.type === 'RUN_FINISHED') {
                    terminal = frame;
                    completed = true;
                  } else target.enqueue(frame);
                }
              } catch {
                abort();
                return;
              }
            }
          }
        } catch {
          if (!ended) {
            completed = false;
            terminal = failure();
            end();
          }
        }
      })();
    },
    async cancel() {
      cancelled = true;
      ended = true;
      detach();
      await reader.cancel().catch(() => {});
      flushOnce();
      await finishOnce();
    },
  });
}
