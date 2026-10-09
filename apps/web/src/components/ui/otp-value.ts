// A space is an empty interior slot. Trailing empty slots are omitted.
// This is UI state, not a server OTP/authentication contract.
export function otpSlots(value: string, length: number): string[] {
  return Array.from({ length }, (_, i) =>
    /[0-9]/.test(value[i] ?? '') ? value[i]! : '',
  );
}
export function editOtp(
  value: string,
  length: number,
  index: number,
  digit: string,
): string {
  const slots = otpSlots(value, length);
  slots[index] = digit.replace(/\D/g, '').slice(-1);
  return slots
    .map((s) => s || ' ')
    .join('')
    .trimEnd();
}
export function pasteOtp(
  value: string,
  length: number,
  index: number,
  text: string,
): string {
  const slots = otpSlots(value, length);
  const digits = text.replace(/\D/g, '').slice(0, length - index);
  if (!digits) return value;
  for (let i = 0; i < digits.length; i++) slots[index + i] = digits[i]!;
  return slots
    .map((s) => s || ' ')
    .join('')
    .trimEnd();
}
