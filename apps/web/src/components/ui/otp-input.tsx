'use client';
import * as React from 'react';
import { cn, FieldMessage, useField } from './field';
import { editOtp, pasteOtp, otpSlots } from './otp-value';
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
  value,
  onChange,
  disabled,
  className,
}: OTPInputProps) {
  const count = Math.max(1, Math.min(12, Math.floor(length) || 6));
  const [internal, setInternal] = React.useState('');
  const actual = value ?? internal;
  const field = useField(undefined, helperText, error);
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const chars = otpSlots(actual, count);
  const change = (next: string) => {
    if (disabled) return;
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };
  return (
    <div className={cn('grid min-w-0 gap-2', disabled && 'opacity-40')}>
      {label && (
        <span
          id={`${field.fieldId}-label`}
          className="text-sm leading-5 font-medium text-text-1"
        >
          {label}
        </span>
      )}
      <div
        role="group"
        aria-labelledby={label ? `${field.fieldId}-label` : undefined}
        className={cn('flex min-w-0 gap-2', className)}
      >
        {chars.map((char, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            value={char}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            aria-label={`${label ?? 'Verification code'} ${index + 1}`}
            aria-invalid={Boolean(error)}
            aria-describedby={field.describedBy}
            onChange={(e) => {
              change(editOtp(actual, count, index, e.target.value));
              if (/[0-9]/.test(e.target.value))
                refs.current[index + 1]?.focus();
            }}
            onPaste={(e) => {
              e.preventDefault();
              if (disabled) return;
              const text = e.clipboardData.getData('text');
              change(pasteOtp(actual, count, index, text));
              refs.current[
                Math.min(count - 1, index + text.replace(/\D/g, '').length)
              ]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') refs.current[index - 1]?.focus();
              if (e.key === 'ArrowRight') refs.current[index + 1]?.focus();
              if (e.key === 'Backspace' && !char)
                refs.current[index - 1]?.focus();
            }}
            className="h-12 w-12 min-w-0 rounded-[12px] border border-input-border bg-card text-center text-lg text-text-1 focus:border-green-2 focus:outline-none focus:ring-1 focus:ring-green-2 aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger disabled:cursor-not-allowed"
          />
        ))}
      </div>
      <FieldMessage
        id={field.messageId}
        helperText={helperText}
        error={error}
      />
    </div>
  );
}
