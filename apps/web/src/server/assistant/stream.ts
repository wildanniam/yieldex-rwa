/** Fence upstream SSE errors and enforce a terminal abort even if the runtime keeps its stream open. */
export function guardedStream(
  source: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  finish: () => void,
) {
  const reader = source.getReader();
  const encoder = new TextEncoder(),
    decoder = new TextDecoder();
  let ended = false,
    buffered = '',
    bytes = 0;
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
      const end = () => {
        if (ended) return;
        ended = true;
        signal.removeEventListener('abort', abort);
        finish();
        target.close();
      };
      const abort = () => {
        if (ended) return;
        target.enqueue(failure());
        void reader.cancel().catch(() => {});
        end();
      };
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
                if (event.type === 'RUN_ERROR') target.enqueue(failure());
                else {
                  delete event.rawEvent;
                  target.enqueue(
                    encoder.encode('data: ' + JSON.stringify(event) + '\n\n'),
                  );
                }
              } catch {
                abort();
                return;
              }
            }
          }
        } catch {
          if (!ended) {
            target.enqueue(failure());
            end();
          }
        }
      })();
    },
    async cancel() {
      if (!ended) {
        ended = true;
        finish();
      }
      await reader.cancel();
    },
  });
}
