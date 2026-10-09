'use client';
import * as React from 'react';
import { cn, FieldMessage, useField } from './field';
export interface Segment {
  label: string;
  value: string;
}
export interface SegmentedControlProps {
  label?: string;
  helperText?: string;
  error?: string;
  options: Segment[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}
export function SegmentedControl({
  label,
  helperText,
  error,
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  className,
}: SegmentedControlProps) {
  const [internal, setInternal] = React.useState(
    defaultValue ?? options[0]?.value,
  );
  const field = useField(undefined, helperText, error);
  const selected = value ?? internal;
  return (
    <div className={cn('grid gap-2', disabled && 'opacity-40')}>
      {label && (
        <span
          id={`${field.fieldId}-label`}
          className="text-sm font-medium leading-5 text-text-1"
        >
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={label ? `${field.fieldId}-label` : undefined}
        aria-describedby={field.describedBy}
        aria-invalid={Boolean(error)}
        className={cn(
          'flex h-12 rounded-[12px] border border-input-border bg-card p-1 gap-1',
          error && 'border-danger',
          className,
        )}
      >
        {options.map((option) => (
          <label key={option.value} className="relative min-w-0 flex-1">
            <input
              type="radio"
              name={field.fieldId}
              value={option.value}
              checked={selected === option.value}
              disabled={disabled}
              onChange={() => {
                if (value === undefined) setInternal(option.value);
                onChange?.(option.value);
              }}
              className="peer absolute inset-0 m-0 w-full h-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span className="pointer-events-none flex h-full items-center justify-center rounded-full px-2 text-xs text-text-2 peer-checked:bg-tint peer-checked:text-green-text peer-focus-visible:ring-2 peer-focus-visible:ring-green-2">
              {option.label}
            </span>
          </label>
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
