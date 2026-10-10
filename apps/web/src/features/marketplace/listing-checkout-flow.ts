import type {
  ListingDetail,
  PreparedIntent,
  PrepareIntentRequest,
} from '@rwa/shared';
import type { MarketplaceWallet, TrackedTransaction } from './wallet';

export type ListingCheckoutState = {
  stage: 'idle' | 'checking' | 'ready' | 'wallet' | 'confirming' | 'complete';
  preview: PreparedIntent | null;
  approvalDone: boolean;
  submitted: TrackedTransaction | null;
  listing: ListingDetail | null;
  error: unknown;
};
export const initialCheckout: ListingCheckoutState = {
  stage: 'idle',
  preview: null,
  approvalDone: false,
  submitted: null,
  listing: null,
  error: null,
};

/** One explicit user click per wallet request. Receipt retries never broadcast again. */
export class ListingCheckoutFlow {
  state: ListingCheckoutState = { ...initialCheckout };
  private locked = false;
  private disposed = false;
  private input: PrepareIntentRequest | undefined;
  constructor(
    private wallet: Pick<MarketplaceWallet, 'prepare' | 'send' | 'track'>,
    private buildRequest: () => Promise<PrepareIntentRequest>,
    private remember: (tx: TrackedTransaction) => void,
    private publish: (state: ListingCheckoutState) => void,
    private isCurrent: () => boolean,
  ) {}
  dispose() {
    this.disposed = true;
  }
  private assertCurrent() {
    if (this.disposed || !this.isCurrent())
      throw new Error('Wallet changed. Review your listing again.');
  }
  private update(patch: Partial<ListingCheckoutState>) {
    this.assertCurrent();
    this.state = { ...this.state, ...patch };
    this.publish(this.state);
  }
  private async review() {
    this.update({ stage: 'checking' });
    this.input ??= await this.buildRequest();
    this.assertCurrent();
    if (this.input.action !== 'CREATE_PRIMARY_LISTING')
      throw new Error('Invalid listing action.');
    const preview = await this.wallet.prepare(this.input);
    this.update({
      preview,
      stage: 'ready',
      approvalDone: preview.state === 'READY',
    });
  }
  private async receipt() {
    const tx = this.state.submitted!;
    const approval = this.state.preview?.state === 'NEEDS_APPROVAL';
    this.update({ stage: 'confirming' });
    const result = await this.wallet.track(tx, this.remember);
    this.assertCurrent();
    if (['REVERTED', 'CANCELLED'].includes(result.tracked.status)) {
      this.update({ submitted: null });
      throw new Error(
        `Transaction ${result.tracked.status.toLowerCase()}. Your listing was not created.`,
      );
    }
    if (!['CONFIRMED', 'FINALIZED'].includes(result.tracked.status)) {
      throw new Error(
        'Transaction is not verified yet. Check its status before continuing.',
      );
    }
    if (approval) {
      this.update({ submitted: null, approvalDone: true });
      // Reuse the exact reviewed financial terms; never rebuild a different offer.
      await this.review();
    } else {
      if (!result.listing)
        throw new Error(
          'Receipt found, but the listing could not be verified. Check status again.',
        );
      this.update({
        stage: 'complete',
        listing: result.listing,
        submitted: null,
      });
    }
  }
  async continue() {
    if (this.locked || this.state.stage === 'complete') return;
    this.locked = true;
    try {
      this.update({ error: null });
      if (this.state.submitted) {
        await this.receipt();
        return;
      }
      if (!this.state.preview) {
        await this.review();
        return;
      }
      const previous = this.state.preview;
      await this.review();
      const preview = this.state.preview!;
      // If allowance/state changed, show the new step first, without opening a different transaction.
      if (
        preview.state !== previous.state ||
        !['READY', 'NEEDS_APPROVAL'].includes(preview.state)
      )
        return;
      this.update({ stage: 'wallet' });
      this.assertCurrent();
      const tx = await this.wallet.send(preview, this.remember);
      this.update({ submitted: tx });
      await this.receipt();
    } catch (error) {
      if (!this.disposed && this.isCurrent())
        this.update({ stage: 'ready', error });
    } finally {
      this.locked = false;
    }
  }
}
