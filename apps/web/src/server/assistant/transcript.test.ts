import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Transcript, historyResult, messageKey } from './transcript';
const initial = [
  { id: 'user-1', role: 'user' as const, content: 'Show listings' },
];
it('keeps server text and only complete tool/result pairs after interruption', () => {
  const t = new Transcript(initial);
  t.accept({ type: 'TEXT_MESSAGE_START', messageId: 'a' });
  t.accept({
    type: 'TEXT_MESSAGE_CONTENT',
    messageId: 'a',
    delta: 'Available ',
  });
  t.accept({ type: 'TEXT_MESSAGE_CONTENT', messageId: 'a', delta: 'results' });
  t.accept({
    type: 'TOOL_CALL_START',
    parentMessageId: 'a',
    toolCallId: 'ok',
    toolCallName: 'searchListings',
  });
  t.accept({ type: 'TOOL_CALL_ARGS', toolCallId: 'ok', delta: '{}' });
  t.accept({
    type: 'TOOL_CALL_RESULT',
    toolCallId: 'ok',
    content: '{"items":[]}',
  });
  t.accept({
    type: 'TOOL_CALL_START',
    parentMessageId: 'a',
    toolCallId: 'partial',
    toolCallName: 'getListing',
  });
  t.accept({
    type: 'TOOL_CALL_ARGS',
    toolCallId: 'partial',
    delta: '{"listing',
  });
  t.accept({ type: 'RAW', rawEvent: { secret: 'do-not-retain' } });
  const result = t.snapshot();
  expect(result).toHaveLength(3);
  expect(result[1]).toMatchObject({
    role: 'assistant',
    content: 'Available results',
    toolCalls: [{ id: 'ok' }],
  });
  expect(JSON.stringify(result)).not.toMatch(/partial|secret|do-not-retain/);
  expect(initial).toEqual([
    { id: 'user-1', role: 'user', content: 'Show listings' },
  ]);
});
it('restores canonical cards with stable identity and excludes malformed financial output', () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        '../../../../../examples/quote-comparison.valid.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const payload = {
    meta: {
      schemaVersion: '1.0',
      requestId: '11111111-1111-4111-8111-111111111111',
      observedAt: 1791417605,
    },
    data: fixture,
  };
  const t = new Transcript(initial);
  t.accept({
    type: 'TOOL_CALL_START',
    toolCallId: 'q',
    toolCallName: 'getPaymentQuotes',
  });
  t.accept({ type: 'TOOL_CALL_ARGS', toolCallId: 'q', delta: '{}' });
  t.accept({
    type: 'TOOL_CALL_RESULT',
    toolCallId: 'q',
    content: JSON.stringify({ kind: 'QUOTE_COMPARISON', payload }),
  });
  t.accept({ type: 'TEXT_MESSAGE_START', messageId: 'a' });
  t.accept({
    type: 'TEXT_MESSAGE_CONTENT',
    messageId: 'a',
    delta: 'See the quoted card.',
  });
  const saved = historyResult('thread', t.snapshot(), 1);
  expect(saved.cards).toHaveLength(1);
  expect(saved.cards[0]?.cardId).toBe('thread:q:QUOTE_COMPARISON');
  expect(saved.text).toBe('See the quoted card.');
  const bad = historyResult(
    'thread',
    [
      {
        id: 'bad',
        role: 'tool',
        toolCallId: 'x',
        content: JSON.stringify({
          kind: 'LISTING_COMPARISON',
          payload: { price: 'guaranteed' },
        }),
      },
    ],
    0,
  );
  expect(bad.cards).toEqual([]);
  expect(messageKey('thread', 'message')).toBe(messageKey('thread', 'message'));
  expect(messageKey('thread', 'message')).not.toBe(
    messageKey('another', 'message'),
  );
  expect(messageKey('thread', 'message')).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/,
  );
});
