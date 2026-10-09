'use client';
import * as React from 'react';
import { cn, FieldMessage } from './field';
export interface ToggleProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string;
  helperText?: string;
  error?: string;
}
export function Toggle({
  id,
  label,
  helperText,
  error,
  className,
  ...props
}: ToggleProps) {
  return (
    <div className="grid gap-2">
      <label
        className={cn(
          'flex items-center gap-3 text-sm text-text-1',
          props.disabled && 'cursor-not-allowed opacity-40',
          className,
        )}
      >
        <span className="relative inline-flex">
          <input
            {...props}
            id={id}
            type="checkbox"
            role="switch"
            className="peer sr-only"
          />
          <span className="h-6 w-10 rounded-full bg-raised ring-1 ring-input-border peer-checked:bg-green-2 peer-focus-visible:ring-2 peer-focus-visible:ring-green-2" />
          <span className="absolute left-1 top-1 size-4 rounded-full bg-text-2 transition-transform peer-checked:translate-x-4 peer-checked:bg-card" />
        </span>
        <span>
          {label}: {props.checked ? 'Enabled' : 'Disabled'}
        </span>
      </label>
      <FieldMessage helperText={helperText} error={error} />
    </div>
  );
}
