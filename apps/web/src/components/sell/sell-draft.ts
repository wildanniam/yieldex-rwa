import { parseUnits } from 'viem';
import manifest from '../../../../../deployments/sepolia.json';

const presentation = {
  demoAAPL: { name: 'Apple', balance: '100' },
  demoMSFT: { name: 'Microsoft', balance: '40' },
  demoSPY: { name: 'S&P 500', balance: '25' },
} as const;

export type SellSymbol = keyof typeof presentation;

/** Illustrative balances only; identity and precision come from the deployment. */
export const sellAssets = (Object.keys(presentation) as SellSymbol[]).map(
  (symbol) => {
    const asset = manifest.assets.find((entry) => entry.symbol === symbol);
    if (!asset) throw new Error(`Missing registered preview asset: ${symbol}`);
    return { ...asset, symbol, ...presentation[symbol] };
  },
);

export const sellSteps = [
  'Asset',
  'Backing',
  'Terms',
  'Review',
  'Ready',
] as const;
export const durationOptions = [30, 90, 180, 365] as const;
export type SellDraft = {
  step: number;
  symbol: SellSymbol;
  amount: string;
  price: string;
  incomeShare: number;
  durationDays: number;
  acknowledged: boolean;
  showErrors: boolean;
};

export const initialSellDraft: SellDraft = {
  step: 0,
  symbol: 'demoAAPL',
  amount: '100',
  price: '90',
  incomeShare: 50,
  durationDays: 180,
  acknowledged: false,
  showErrors: false,
};

type FinancialFields = Pick<
  SellDraft,
  'symbol' | 'amount' | 'price' | 'incomeShare' | 'durationDays'
>;
export type SellAction =
  | { type: 'edit'; values: Partial<FinancialFields> }
  | { type: 'acknowledge'; value: boolean }
  | { type: 'advance' }
  | { type: 'back'; step: number }
  | { type: 'reset' };

function positiveAmount(value: string, decimals: number) {
  // parseUnits rounds excess precision, so reject it before conversion.
  if (!/^\d+(?:\.\d+)?$/.test(value) || value.length > 100) return null;
  if ((value.split('.')[1]?.length ?? 0) > decimals) return null;
  const atomic = parseUnits(value, decimals);
  return atomic > 0n && atomic <= 2n ** 256n - 1n ? atomic : null;
}

export function validateSellDraft(draft: SellDraft) {
  const asset = sellAssets.find((entry) => entry.symbol === draft.symbol)!;
  const amountAtomic = positiveAmount(draft.amount, asset.tokenDecimals);
  const priceAtomic = positiveAmount(
    draft.price,
    manifest.paymentToken.decimals,
  );
  const errors: Partial<
    Record<'amount' | 'price' | 'incomeShare' | 'durationDays', string>
  > = {};
  if (amountAtomic === null) {
    errors.amount = `Enter a positive amount with up to ${asset.tokenDecimals} decimal places.`;
  } else if (amountAtomic > parseUnits(asset.balance, asset.tokenDecimals)) {
    errors.amount = `The example balance is ${asset.balance} ${asset.symbol}. Choose a smaller amount.`;
  }
  if (priceAtomic === null) {
    errors.price = `Enter a positive price with up to ${manifest.paymentToken.decimals} decimal places.`;
  }
  if (
    !Number.isInteger(draft.incomeShare) ||
    draft.incomeShare < 1 ||
    draft.incomeShare > 100
  ) {
    errors.incomeShare = 'Choose an income share from 1% to 100%.';
  }
  if (!durationOptions.some((days) => days === draft.durationDays)) {
    errors.durationDays = 'Choose one of the available periods.';
  }
  return { errors, amountAtomic, priceAtomic };
}

export function sellDraftReducer(
  draft: SellDraft,
  action: SellAction,
): SellDraft {
  switch (action.type) {
    case 'edit':
      return {
        ...draft,
        ...action.values,
        acknowledged: false,
        showErrors: false,
      };
    case 'acknowledge':
      return { ...draft, acknowledged: action.value };
    case 'back':
      return Number.isInteger(action.step) &&
        action.step >= 0 &&
        action.step < draft.step
        ? { ...draft, step: action.step, showErrors: false }
        : draft;
    case 'reset':
      return { ...initialSellDraft };
    case 'advance': {
      const { errors } = validateSellDraft(draft);
      const invalid =
        (draft.step >= 1 && Boolean(errors.amount)) ||
        (draft.step >= 2 && Object.keys(errors).length > 0) ||
        (draft.step === 3 && !draft.acknowledged);
      if (invalid) return { ...draft, showErrors: true };
      return { ...draft, step: Math.min(draft.step + 1, 4), showErrors: false };
    }
  }
}
