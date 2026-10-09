import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const modalSource = readFileSync(
  resolve(__dirname, '../../../components/marketplace/buy-modal.tsx'),
  'utf8',
);
const detailSource = readFileSync(resolve(__dirname, 'page.tsx'), 'utf8');

describe('purchase modal flow contracts', () => {
  it('contains the four-step purchase state machine and consent gate', () => {
    expect(modalSource).toContain(
      "type BuyStep = 'review' | 'pay' | 'confirm' | 'done'",
    );
    expect(modalSource).toContain('disabled={!understood}');
    expect(modalSource).toContain('Pay with swap quote');
    expect(modalSource).toContain('Confirm in wallet');
    expect(modalSource).toContain('Purchase complete');
  });

  it('keeps the demo boundary explicit and connects the detail CTA', () => {
    expect(modalSource).toContain(
      'Demo-only confirmation; no wallet transaction is sent.',
    );
    expect(modalSource).toContain('Confirmed demo receipt');
    expect(modalSource).toContain('href="/positions"');
    expect(detailSource).toContain('<BuyModal');
  });
});
