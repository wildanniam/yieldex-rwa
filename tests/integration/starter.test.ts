import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { INTERFACE_VERSION } from '@rwa/shared';
import { GET } from '../../apps/web/src/app/api/health/route.js';
import { createWorkerServer } from '../../apps/worker/src/server.js';

const workerDirectory = resolve(import.meta.dirname, '../../apps/worker');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function spawnWorker(port: number) {
  return spawn(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    cwd: workerDirectory,
    env: { PATH: process.env.PATH, WORKER_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function stopWorker(child: ReturnType<typeof spawnWorker>) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  const timeout = setTimeout(() => child.kill('SIGKILL'), 4000);
  try {
    await exited;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForHealth(
  port: number,
  child: ReturnType<typeof spawnWorker>,
) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null)
      throw new Error(`Worker exited early: ${child.exitCode}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return response.json();
    } catch {
      /* Listener is not ready yet. */
    }
    await sleep(50);
  }
  throw new Error('Worker did not become live.');
}

it('web and worker expose the same interface version, without claiming product readiness', async () => {
  const server = createWorkerServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Expected TCP listener');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const web = GET();
    expect(web.headers.get('cache-control')).toBe('no-store');
    expect(await web.json()).toMatchObject({
      interfaceVersion: INTERFACE_VERSION,
      stage: 'FOUNDATION_ONLY',
      integrations: 'NOT_IMPLEMENTED',
    });
    const worker = await fetch(`${base}/health`);
    expect(worker.status).toBe(200);
    expect(await worker.json()).toMatchObject({
      interfaceVersion: INTERFACE_VERSION,
      stage: 'FOUNDATION_ONLY',
      jobsEnabled: false,
    });
    expect((await fetch(`${base}/health`, { method: 'POST' })).status).toBe(
      405,
    );
    expect((await fetch(`${base}/unknown`)).status).toBe(404);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

it('worker one-shot exits cleanly without opening a service or requiring secrets', async () => {
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', 'src/main.ts', '--once'],
    {
      cwd: resolve(import.meta.dirname, '../../apps/worker'),
      env: { PATH: process.env.PATH, WORKER_PORT: '3101' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout.on('data', (data) => {
    output += data.toString();
  });
  const [code] = await once(child, 'exit');
  expect(code).toBe(0);
  expect(JSON.parse(output)).toMatchObject({
    jobsEnabled: false,
    stage: 'FOUNDATION_ONLY',
  });
});

it('reports an occupied port, then stops and restarts without leaving the port occupied', async () => {
  const blocker = createWorkerServer();
  blocker.listen(0, '127.0.0.1');
  await once(blocker, 'listening');
  const address = blocker.address();
  if (!address || typeof address === 'string')
    throw new Error('Expected TCP listener');
  const collision = spawnWorker(address.port);
  let stderr = '';
  collision.stderr.on('data', (data) => {
    stderr += data.toString();
  });
  try {
    const [code] = await once(collision, 'exit');
    expect(code).toBe(1);
    expect(stderr).toContain('EADDRINUSE');
  } finally {
    await stopWorker(collision);
    await new Promise<void>((resolve) => blocker.close(() => resolve()));
  }
  for (let iteration = 0; iteration < 2; iteration++) {
    const child = spawnWorker(address.port);
    try {
      expect(await waitForHealth(address.port, child)).toMatchObject({
        jobsEnabled: false,
      });
    } finally {
      await stopWorker(child);
    }
    expect(child.exitCode).toBe(0);
  }
});
