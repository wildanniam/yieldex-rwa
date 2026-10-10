import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { validateData } from '@rwa/shared/validation';
import { GroundedOutput } from './grounding';
import { Transcript, historyResult } from './transcript';

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../../../../../examples/${name}`, import.meta.url),
      'utf8',
    ),
  );
const meta = {
  schemaVersion: '1.0',
  requestId: '11111111-1111-4111-8111-111111111111',
  observedAt: 1791417605,
};
const quote = {
  kind: 'QUOTE_COMPARISON',
  payload: { meta, data: fixture('quote-hypothetical-ranked.valid.json') },
};
const asset = {
  kind: 'ASSET_CONTEXT',
  payload: {
    meta,
    data: {
      asset: fixture('asset.valid.json'),
      payoutModel: 'IN_KIND_REBASING_SHARES',
      isDemo: true,
      summary: 'Aset backing simulasi; posisi hak pendapatan terpisah.',
      risks: ['Pendapatan tidak dijamin.'],
      sources: [
        {
          title: 'Yieldex product context',
          url: 'https://github.com/wildanniam/yieldex-rwa',
          observedAt: meta.observedAt,
        },
      ],
    },
  },
};
type Event = Record<string, unknown>;
const start = (id: string, name: string): Event => ({
  type: 'TOOL_CALL_START',
  toolCallId: id,
  toolCallName: name,
  parentMessageId: `assistant-${id}`,
});
const result = (id: string, payload: unknown): Event => ({
  type: 'TOOL_CALL_RESULT',
  toolCallId: id,
  messageId: `result-${id}`,
  content: JSON.stringify(payload),
});
const textEvents = (id: string, text: string): Event[] => [
  { type: 'TEXT_MESSAGE_START', messageId: id, role: 'assistant' },
  { type: 'TEXT_MESSAGE_CONTENT', messageId: id, delta: text },
  { type: 'TEXT_MESSAGE_END', messageId: id },
];
const text = (events: Event[]) =>
  events
    .filter((event) => event.type === 'TEXT_MESSAGE_CONTENT')
    .map((event) => event.delta)
    .join('');
function feed(output: GroundedOutput, events: Event[]) {
  return events.flatMap((event) => output.accept(event));
}

it('withholds incorrect financial prose before and after tools while preserving exact canonical quote data', () => {
  expect(
    validateData('api.QuoteComparisonResponse', quote.payload).success,
  ).toBe(true);
  const output = new GroundedOutput('quote-run');
  const before = feed(
    output,
    textEvents('model-before', 'Guaranteed 2.4878 juta USDC from 1 ETH.'),
  );
  expect(text(before)).toBe('');
  const wire = feed(output, [
    start('quote', 'getPaymentQuotes'),
    result('quote', quote),
    ...textEvents('model-after', 'Net profit guaranteed. Gas is free.'),
  ]);
  expect(text(wire)).toBe('');
  const finished = output.finish(true);
  expect(text(finished)).not.toMatch(/2\.4878|juta|guaranteed|free/i);
  expect(text(finished)).toMatch(/quote/i);
  expect(text(finished)).toMatch(/biaya|gross|kotor|bruto/i);
  expect(text(finished)).toMatch(/hipotet|hypothet/i);
  const card = wire.find((event) => event.type === 'TOOL_CALL_RESULT');
  expect(JSON.parse(String(card?.content))).toEqual(quote);
  expect(output.finish(true)).toEqual([]);
});

it('describes the asset as backing and the income-right position as separate', () => {
  expect(validateData('api.AssetContextResponse', asset.payload).success).toBe(
    true,
  );
  const output = new GroundedOutput('asset-run');
  feed(output, [
    start('asset', 'getAssetContext'),
    result('asset', asset),
    ...textEvents(
      'wrong-asset-model',
      'DemoSPY itself is the purchased time-limited income right.',
    ),
  ]);
  const summary = text(output.finish(true));
  expect(summary).toMatch(/backing/i);
  expect(summary).toMatch(/posisi|position/i);
  expect(summary).toMatch(/terpisah|berbeda|separate|bukan/i);
  expect(summary).not.toContain('itself is the purchased');
});

it('handles multiple tools and duplicate results without duplicating canonical cards or summaries', () => {
  const output = new GroundedOutput('multi-run');
  const wire = feed(output, [
    start('asset', 'getAssetContext'),
    result('asset', asset),
    result('asset', asset),
    start('quote', 'getPaymentQuotes'),
    result('quote', quote),
  ]);
  expect(
    wire.filter(
      (event) =>
        event.type === 'TOOL_CALL_RESULT' && event.toolCallId === 'asset',
    ),
  ).toHaveLength(1);
  const summary = text(output.finish(true));
  expect(summary).toMatch(/backing/i);
  expect(summary).toMatch(/quote/i);
});

it('does not turn tool errors or malformed payloads into fabricated successful summaries', () => {
  for (const payload of [
    { error: { code: 'TOOL_TIMEOUT', message: 'Data unavailable' } },
    { kind: 'QUOTE_COMPARISON', payload: { guaranteedProfit: 'millions' } },
    asset, // A valid payload for a different tool must not pass as quote data.
  ]) {
    const output = new GroundedOutput('failed-run');
    const wire = feed(output, [
      start('quote', 'getPaymentQuotes'),
      result('quote', payload),
      ...textEvents('model', 'Quote succeeded: guaranteed millions.'),
    ]);
    const summary = text(output.finish(true));
    expect(summary).toMatch(/belum|gagal|tidak|unavailable|failed/i);
    expect(summary).not.toMatch(/guaranteed|millions|succeeded/i);
    expect(JSON.stringify(wire)).not.toContain('guaranteedProfit');
  }
});

it('saves exactly the grounded wire summary and validated cards, never discarded model prose', () => {
  const output = new GroundedOutput('durable-run');
  const transcript = new Transcript([
    { id: 'user', role: 'user', content: 'Compare a quote' },
  ]);
  const wire = feed(output, [
    ...textEvents('model', '2.4878 juta USDC guaranteed!'),
    start('quote', 'getPaymentQuotes'),
    {
      type: 'TOOL_CALL_ARGS',
      toolCallId: 'quote',
      delta: JSON.stringify(quote.payload.data.request),
    },
    result('quote', quote),
  ]);
  wire.push(...output.finish(true));
  for (const event of wire) transcript.accept(event);
  const checkpoint = transcript.snapshot();
  const saved = historyResult('public-thread', checkpoint, 1);
  expect(saved.text).toBe(text(wire));
  expect(saved.cards).toHaveLength(1);
  expect(saved.cards[0]?.payload).toEqual(quote.payload);
  expect(JSON.stringify(checkpoint)).not.toMatch(/juta|guaranteed/);
});

it('keeps completed tool data on interruption but never releases speculative text', () => {
  const output = new GroundedOutput('stop-run');
  const wire = feed(output, [
    ...textEvents('speculation', 'The trade definitely succeeded.'),
    start('asset', 'getAssetContext'),
    result('asset', asset),
    start('pending', 'getPaymentQuotes'),
  ]);
  const partial = output.finish(false);
  expect(text([...wire, ...partial])).not.toContain('definitely succeeded');
  expect(text(partial)).toMatch(/dihentikan|terhenti|belum|interrupted|stop/i);
  expect(
    wire.filter((event) => event.type === 'TOOL_CALL_RESULT'),
  ).toHaveLength(1);
  expect(output.finish(false)).toEqual([]);
});

it('releases ordinary no-tool answers only after completion and strips raw/snapshot bypasses', () => {
  const output = new GroundedOutput('ordinary-run');
  const ordinary = textEvents('answer', 'IncomeBps bukan APY.');
  expect(
    feed(output, [
      ...ordinary,
      { type: 'RAW', rawEvent: { private: 'never expose' } },
      { type: 'MESSAGES_SNAPSHOT', messages: [{ content: 'bypass' }] },
    ]),
  ).toEqual([]);
  expect(output.finish(true)).toEqual(ordinary);
  const aborted = new GroundedOutput('ordinary-stop');
  feed(aborted, textEvents('partial', 'Speculative unfinished answer'));
  const stopped = aborted.finish(false);
  expect(text(stopped)).not.toContain('Speculative unfinished');
  expect(text(stopped)).toMatch(/dihentikan|terhenti|interrupted|stop/i);
  expect(stopped.map((event) => event.type)).toEqual([
    'TEXT_MESSAGE_START',
    'TEXT_MESSAGE_CONTENT',
    'TEXT_MESSAGE_END',
  ]);
  expect(stopped[0]?.messageId).toBe('grounded-ordinary-stop');
  expect(new GroundedOutput('ordinary-stop').finish(false)).toEqual(stopped);
  expect(aborted.finish(false)).toEqual([]);
  expect(aborted.finish(true)).toEqual([]);
  const collector = new Transcript([
    { id: 'stopped-question', role: 'user', content: 'Explain everything.' },
  ]);
  for (const event of stopped) collector.accept(event);
  expect(collector.snapshot()).toEqual([
    { id: 'stopped-question', role: 'user', content: 'Explain everything.' },
    {
      id: 'grounded-ordinary-stop',
      role: 'assistant',
      content: text(stopped),
    },
  ]);
});

it('uses distinct deterministic generated-message identity for successive runs', () => {
  function message(runId: string) {
    const output = new GroundedOutput(runId);
    feed(output, [start('asset', 'getAssetContext'), result('asset', asset)]);
    return output
      .finish(true)
      .find((event) => event.type === 'TEXT_MESSAGE_START')?.messageId;
  }
  expect(message('one')).toBe(message('one'));
  expect(message('one')).not.toBe(message('two'));
});

it('explains a raw listing response with exact validated terms and canonical navigation', () => {
  const listing = fixture('listing-primary.valid.json');
  const payload = { meta, data: listing };
  expect(validateData('api.ListingResponse', payload).success).toBe(true);
  const output = new GroundedOutput('listing-detail-run');
  const wire = feed(output, [
    start('listing', 'getListing'),
    result('listing', payload),
    ...textEvents('wrong', 'The listing price is 90 million and APY is 50%.'),
  ]);
  const summary = text(output.finish(true));
  expect(summary).toContain('#1');
  expect(summary).toContain('OPEN');
  expect(summary).toContain('90 DemoUSD');
  expect(summary).toContain('50%');
  expect(summary).toContain(
    '/marketplace/live/' + encodeURIComponent(listing.listing.listingKey),
  );
  expect(summary).not.toMatch(/million|APY is/i);
  expect(
    JSON.parse(
      String(wire.find((e) => e.type === 'TOOL_CALL_RESULT')?.content),
    ),
  ).toEqual(payload);
});

it('explains a raw position response without conflating its two owners or income share with backing', () => {
  const position = fixture('position-active.valid.json');
  const payload = { meta, data: position };
  expect(validateData('api.PositionResponse', payload).success).toBe(true);
  const output = new GroundedOutput('position-detail-run');
  const wire = feed(output, [
    start('position', 'getPosition'),
    result('position', payload),
  ]);
  const summary = text(output.finish(true));
  expect(summary).toContain('ACTIVE');
  expect(summary).toContain(position.principalOwner);
  expect(summary).toContain(position.rightsOwner);
  expect(summary).toContain('50%');
  expect(summary).toMatch(/backing/i);
  expect(summary).toMatch(/terpisah|berbeda|bukan/i);
  expect(
    JSON.parse(
      String(wire.find((e) => e.type === 'TOOL_CALL_RESULT')?.content),
    ),
  ).toEqual(payload);
});
