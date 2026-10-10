import { formatUnits } from 'viem';

/** Display-only rounding. Transaction amounts always retain their atomic value. */
export function claimAmount(value: string | null, decimals: number): string {
  if (value === null) return 'Unavailable';
  const atomic = BigInt(value);
  if (decimals <= 6) return formatUnits(atomic, decimals);
  const step = 10n ** BigInt(decimals - 6);
  if (atomic > 0n && atomic < step) return '< 0.000001';
  if (atomic % step === 0n) return formatUnits(atomic, decimals);
  return `≈ ${formatUnits((atomic + step / 2n) / step, 6)}`;
}
