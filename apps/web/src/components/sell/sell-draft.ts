import { positiveAtomic } from '@/features/marketplace/data';
export const sellSteps = [
  'Asset',
  'Backing',
  'Terms',
  'Review',
  'Wallet',
] as const;
export const durationOptions = [30, 90, 180, 365] as const;
export type SellDraft = {
  step: number;
  assetKey: string;
  amount: string;
  price: string;
  incomeShare: number;
  durationDays: number;
  acknowledged: boolean;
  showErrors: boolean;
};
export const initialSellDraft: SellDraft = {
  step: 0,
  assetKey: '',
  amount: '',
  price: '',
  incomeShare: 50,
  durationDays: 180,
  acknowledged: false,
  showErrors: false,
};
export function validateSellDraft(
  draft: SellDraft,
  context: {
    decimals: number;
    paymentDecimals: number;
    balance: string | null;
  },
) {
  const amountAtomic = positiveAtomic(draft.amount, context.decimals);
  const priceAtomic = positiveAtomic(draft.price, context.paymentDecimals);
  const errors: Partial<
    Record<'amount' | 'price' | 'incomeShare' | 'durationDays', string>
  > = {};
  if (amountAtomic === null)
    errors.amount = `Enter a positive amount with up to ${context.decimals} decimals.`;
  else if (context.balance === null)
    errors.amount = 'Wallet balance is unavailable. Refresh before continuing.';
  else if (BigInt(amountAtomic) > BigInt(context.balance))
    errors.amount = 'This amount exceeds your wallet balance.';
  if (priceAtomic === null)
    errors.price = `Enter a positive price with up to ${context.paymentDecimals} decimals.`;
  if (
    !Number.isInteger(draft.incomeShare) ||
    draft.incomeShare < 1 ||
    draft.incomeShare > 100
  )
    errors.incomeShare = 'Choose an income share from 1% to 100%.';
  if (!durationOptions.some((days) => days === draft.durationDays))
    errors.durationDays = 'Choose an available period.';
  return { errors, amountAtomic, priceAtomic };
}
