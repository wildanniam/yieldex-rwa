'use client';
import * as React from 'react';
import { cn, FieldMessage } from './field';
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
  const selected = value ?? internal;
  return (
    <div className="grid gap-2">
      {label && (
        <span className="text-xs leading-[14px] text-text-2">{label}</span>
      )}
      <div
        role="radiogroup"
        className={cn(
          'flex h-12 rounded-[12px] border border-input-border bg-card p-1',
          error && 'border-danger',
          className,
        )}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected === option.value}
            disabled={disabled}
            onClick={() => {
              setInternal(option.value);
              onChange?.(option.value);
            }}
            className={cn(
              'flex-1 rounded-full text-xs text-text-2 disabled:cursor-not-allowed disabled:opacity-40',
              selected === option.value && 'bg-tint text-green-text',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <FieldMessage helperText={helperText} error={error} />
    </div>
  );
}
