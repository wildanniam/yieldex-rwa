'use client';
import * as React from 'react';
import { cn, FieldLabel, FieldMessage } from './field';
export interface OTPInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}
export function OTPInput({
  label,
  helperText,
  error,
  length = 6,
  value = '',
  onChange,
  disabled,
  className,
}: OTPInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, index) => value[index] ?? '');
  const update = (index: number, next: string) => {
    const digit = next.replace(/\D/g, '').slice(-1);
    const nextValue = chars
      .map((char, i) => (i === index ? digit : char))
      .join('');
    onChange?.(nextValue);
    if (digit) refs.current[index + 1]?.focus();
  };
  return (
    <div className="grid gap-2">
      {label && <FieldLabel>{label}</FieldLabel>}
      <div
        className={cn('flex gap-2', className)}
        onPaste={(event) => {
          event.preventDefault();
          onChange?.(
            event.clipboardData
              .getData('text')
              .replace(/\D/g, '')
              .slice(0, length),
          );
        }}
      >
        {chars.map((char, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={char}
            maxLength={1}
            inputMode="numeric"
            disabled={disabled}
            aria-label={`${label ?? 'Verification code'} ${index + 1}`}
            onChange={(event) => update(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !chars[index])
                refs.current[index - 1]?.focus();
            }}
            className={cn(
              'h-12 w-12 rounded-[12px] border border-input-border bg-card text-center text-lg text-text-1 focus:border-green-2 focus:outline-none focus:ring-1 focus:ring-green-2 disabled:cursor-not-allowed disabled:opacity-40',
              error && 'border-danger',
            )}
          />
        ))}
      </div>
      <FieldMessage helperText={helperText} error={error} />
    </div>
  );
}
