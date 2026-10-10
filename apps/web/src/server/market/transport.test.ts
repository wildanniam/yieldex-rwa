import { describe, expect, it, vi } from 'vitest';
import { createPublicClient } from 'viem';
import { marketTransport } from './transport';

const reply = (init?: RequestInit) => {
  const body = JSON.parse(String(init?.body));
  return Response.json(
    body.map((r: { id: number }) => ({
      jsonrpc: '2.0',
      id: r.id,
      result: '0xaa36a7',
    })),
  );
};
describe('market RPC transport', () => {
  it('batches overlapping calls and retries a temporary 429', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockImplementation(async (_, init) => reply(init));
    const client = createPublicClient({
      transport: marketTransport('https://rpc.test/recovery', fetcher),
    });
    const result = await Promise.all([
      client.getChainId(),
      client.getBlockNumber({ cacheTime: 0 }),
    ]);
    expect(result).toEqual([11155111, 11155111n]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetcher.mock.calls[0]![1]!.body))).toHaveLength(2);
  });
  it('stops after two retries during a persistent outage', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response('', { status: 429 }));
    const client = createPublicClient({
      transport: marketTransport('https://rpc.test/failure', fetcher),
    });
    await expect(client.getChainId()).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it('does not retry invalid requests', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response('', { status: 400 }));
    const client = createPublicClient({
      transport: marketTransport('https://rpc.test/invalid', fetcher),
    });
    await expect(client.getChainId()).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe('same-chain RPC backup', () => {
  it('uses the backup after primary rate limiting', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (input, init) =>
        String(input).includes('/primary')
          ? new Response('', { status: 429 })
          : reply(init),
      );
    const client = createPublicClient({
      transport: marketTransport(
        'https://rpc.test/primary',
        fetcher,
        'https://rpc.test/backup',
      ),
    });
    expect(await client.getChainId()).toBe(11155111);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('does not use a backup to hide a deterministic RPC error', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_, init) => {
        const body = JSON.parse(String(init?.body));
        return Response.json(
          body.map((r: { id: number }) => ({
            jsonrpc: '2.0',
            id: r.id,
            error: { code: -32602, message: 'invalid parameters' },
          })),
        );
      });
    const client = createPublicClient({
      transport: marketTransport(
        'https://rpc.test/bad-primary',
        fetcher,
        'https://rpc.test/unused',
      ),
    });
    await expect(client.getChainId()).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('fails visibly when both providers remain unavailable', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response('', { status: 503 }));
    const client = createPublicClient({
      transport: marketTransport(
        'https://rpc.test/down-primary',
        fetcher,
        'https://rpc.test/down-backup',
      ),
    });
    await expect(client.getChainId()).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
