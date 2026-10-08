export function readWorkerConfig(env: NodeJS.ProcessEnv) {
  const value = env.WORKER_PORT ?? '3101';
  if (!/^[1-9]\d{0,4}$/.test(value) || Number(value) > 65535) {
    throw new Error('WORKER_PORT must be an integer between 1 and 65535.');
  }
  // Starter has no RPC/provider/signing configuration and cannot process jobs.
  return { host: '127.0.0.1', port: Number(value) } as const;
}
