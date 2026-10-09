'use client';

import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { cn, controlClasses, FieldLabel, FieldMessage } from './field';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ id, label, helperText, error, className, ...props }, ref) => (
    <div className="grid gap-2">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={helperText || error ? `${id}-message` : undefined}
        className={cn(
          controlClasses,
          error && 'border-danger focus:border-danger focus:ring-danger',
          className,
        )}
        {...props}
      />
      <FieldMessage
        id={id ? `${id}-message` : undefined}
        helperText={helperText}
        error={error}
      />
    </div>
  ),
);
TextInput.displayName = 'TextInput';

export type PasswordInputProps = TextInputProps;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <TextInput
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-12', className)}
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-[30px] text-text-2"
        onClick={() => setVisible((value) => !value)}
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={20} alt="" />
      </button>
    </div>
  );
}

export interface AmountInputProps extends TextInputProps {
  currency?: string;
  onMax?: () => void;
  simulatedUsd?: string;
  balanceText?: string;
  simulationLabel?: string;
}

export function AmountInput({
  currency = 'DemoUSD',
  onMax,
  simulatedUsd,
  balanceText,
  simulationLabel = 'SIMULATED · Sepolia',
  ...props
}: AmountInputProps) {
  return (
    <div className="grid gap-2">
      <div className="relative">
        <TextInput {...props} inputMode="decimal" className="pr-28" />
        <span className="absolute right-12 top-3 rounded-full bg-raised px-2 py-1 text-xs text-text-2">
          {currency}
        </span>
        <button
          type="button"
          onClick={onMax}
          disabled={props.disabled}
          className="absolute right-2 top-3 text-xs text-green-text disabled:opacity-40"
        >
          MAX
        </button>
      </div>
      <span className="w-fit rounded-full bg-yellow px-2 py-1 text-[11px] text-canvas">
        {simulationLabel}
      </span>
      {simulatedUsd && (
        <span className="text-xs text-text-3">
          ≈ {simulatedUsd} USD · Illustrative
        </span>
      )}
      {balanceText && (
        <span className="text-xs text-text-3">{balanceText}</span>
      )}
    </div>
  );
}
