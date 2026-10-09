'use client';
import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import {
  cn,
  controlClasses,
  FieldLabel,
  FieldMessage,
  useField,
} from './field';
export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      className,
      startAdornment,
      endAdornment,
      disabled,
      'aria-describedby': describedBy,
      ...props
    },
    ref,
  ) => {
    const field = useField(id, helperText, error, describedBy);
    return (
      <div className={cn('grid gap-2 min-w-0', disabled && 'opacity-40')}>
        {label && <FieldLabel htmlFor={field.fieldId}>{label}</FieldLabel>}
        <div className="relative flex items-center">
          {startAdornment && (
            <div className="absolute left-4 flex items-center text-text-2">
              {startAdornment}
            </div>
          )}
          <input
            {...props}
            ref={ref}
            id={field.fieldId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={field.describedBy}
            className={cn(
              controlClasses,
              'disabled:opacity-100',
              startAdornment && 'pl-12',
              endAdornment && 'pr-12',
              className,
            )}
          />
          {endAdornment && (
            <div className="absolute right-4 flex items-center gap-2 text-text-2">
              {endAdornment}
            </div>
          )}
        </div>
        <FieldMessage
          id={field.messageId}
          helperText={helperText}
          error={error}
        />
      </div>
    );
  },
);
TextInput.displayName = 'TextInput';
export type PasswordInputProps = TextInputProps;
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  return (
    <TextInput
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          disabled={props.disabled}
          className="inline-flex size-7 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-green-2 disabled:cursor-not-allowed"
          onClick={() => setVisible((v) => !v)}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={20} alt="" />
        </button>
      }
    />
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
  className,
  ...props
}: AmountInputProps) {
  return (
    <div className="grid gap-2 min-w-0">
      <TextInput
        {...props}
        inputMode="decimal"
        className={cn('pr-32', className)}
        endAdornment={
          <>
            <span className="rounded-full bg-raised px-2 py-1 text-xs text-text-2">
              {currency}
            </span>
            <button
              type="button"
              onClick={onMax}
              disabled={props.disabled || !onMax}
              className="text-xs text-green-text rounded focus-visible:outline-2 focus-visible:outline-green-2 disabled:cursor-not-allowed"
            >
              MAX
            </button>
          </>
        }
      />
      <div
        className={cn(
          'grid gap-2 text-xs leading-4 text-text-2',
          props.disabled && 'opacity-40',
        )}
      >
        <span className="w-fit rounded-full bg-yellow px-2 py-1 font-medium text-[#1a1405]">
          {simulationLabel}
        </span>
        {simulatedUsd && <span>≈ {simulatedUsd} USD · Illustrative</span>}
        {balanceText && <span>{balanceText}</span>}
      </div>
    </div>
  );
}
