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
