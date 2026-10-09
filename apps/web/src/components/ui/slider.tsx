'use client';
import * as React from 'react';
import { cn, FieldLabel, FieldMessage } from './field';
export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}
export function Slider({
  id,
  label,
  helperText,
  error,
  value,
  defaultValue,
  className,
  ...props
}: SliderProps) {
  const numeric = Number(value ?? defaultValue ?? 0);
  return (
    <div className="grid gap-2">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <output
        htmlFor={id}
        className={cn(
          'w-fit rounded-full border border-input-border bg-raised px-3 py-1 text-xs',
          error && 'border-danger text-danger',
        )}
      >
        {numeric}%
      </output>
      <input
        {...props}
        id={id}
        type="range"
        min={0}
        max={100}
        value={value}
        defaultValue={defaultValue}
        className={cn(
          'h-2 w-full accent-green-1',
          error && 'accent-danger',
          className,
        )}
      />
      <div className="flex justify-between text-xs text-text-3">
        <span>0%</span>
        <span>100%</span>
      </div>
      <FieldMessage helperText={helperText} error={error} />
    </div>
  );
}
