import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(resolve(__dirname, 'page.tsx'), 'utf8');

describe('Sell multi-step flow contracts', () => {
  it('renders the stepper and asset selection surface', () => {
    expect(routeSource).toContain(
      "type SellStep = 'asset' | 'deposit' | 'terms' | 'review' | 'confirm'",
    );
    expect(routeSource).toContain('Choose a backing asset');
    expect(routeSource).toContain('dAAPL');
    expect(routeSource).toContain('dNVDA');
    expect(routeSource).toContain('dKO');
    expect(routeSource).toContain('Unregistered token · Disabled');
    expect(routeSource).toContain(
      'Not in the asset registry, cannot be deposited.',
    );
  });

  it('keeps the preview explicitly draft and non-transactional', () => {
    expect(routeSource).toContain('Your listing');
    expect(routeSource).toContain('Draft preview');
    expect(routeSource).toContain('Backing not deposited');
    expect(routeSource).toContain('This is not a loan.');
    expect(routeSource).toContain('CREATE_PRIMARY_LISTING');
  });

  it('renders the deposit step boundary', () => {
    expect(routeSource).toContain('Deposit your backing');
    expect(routeSource).toContain('AmountInput');
    expect(routeSource).toContain(
      'Deposited tokens are locked as backing for this listing.',
    );
    expect(routeSource).toContain('Approve');
    expect(routeSource).toContain('Deposit to vault');
    expect(routeSource).toContain('Exactly');
    expect(routeSource).toContain('Yieldex Vault · Ethereum Sepolia');
    expect(routeSource).toContain('Deposit awaiting your signature');
    expect(routeSource).toContain('Backing pending deposit');
    expect(routeSource).toContain('Open wallet');
  });

  it('renders the interactive terms step boundary', () => {
    expect(routeSource).toContain('Set your listing terms');
    expect(routeSource).toContain('Income share');
    expect(routeSource).toContain('Slider');
    expect(routeSource).toContain('min={10}');
    expect(routeSource).toContain('max={100}');
    expect(routeSource).toContain('SegmentedControl');
    expect(routeSource).toContain('90 DemoUSD');
    expect(routeSource).toContain('Estimated income to buyer');
    expect(routeSource).toContain(
      'Illustrative only · not guaranteed; may be zero.',
    );
    expect(routeSource).toContain('Updated 07 Oct 2026 10:42 UTC');
  });

  it('renders the guarded review step boundary', () => {
    expect(routeSource).toContain('Review before creating');
    expect(routeSource).toContain(
      'Check the rights you’re offering. Creating a listing does not sell or transfer your principal.',
    );
    expect(routeSource).toContain('Retained rights');
    expect(routeSource).toContain('Buyer income share');
    expect(routeSource).toContain('Income token');
    expect(routeSource).toContain('Upfront payment');
    expect(routeSource).toContain('Network fee');
    expect(routeSource).toContain(
      'You can cancel until it is sold; cancelling releases your',
    );
    expect(routeSource).toContain(
      'I understand income may be lower than estimated or zero.',
    );
    expect(routeSource).toContain('Ready to publish');
    expect(routeSource).toContain('disabled={!canPublish}');
    expect(routeSource).toContain("if (step === 'review' && !canPublish)");
  });

  it('renders the final confirm boundary without a chain side effect', () => {
    expect(routeSource).toContain('Listing created');
    expect(routeSource).toContain(
      'All creation steps are confirmed in this simulated completion state.',
    );
    expect(routeSource).toContain('Confirmed · exact allowance');
    expect(routeSource).toContain('Confirmed · L-0142 published');
    expect(routeSource).toContain('Listing L-0142 is live');
    expect(routeSource).toContain('Backing retained by seller');
    expect(routeSource).toContain('Create listing');
    expect(routeSource).toContain('disabled={!riskAcknowledged}');
    expect(routeSource).toContain("router.push('/listings?created=simulated')");
    expect(routeSource).not.toContain('signTransaction');
  });
});
