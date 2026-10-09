'use client';
import * as React from 'react';
import { cn, FieldMessage, useField } from './field';
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
  checked,
  defaultChecked,
  onChange,
  disabled,
  'aria-describedby': describedBy,
  ...props
}: ToggleProps) {
  const field = useField(id, helperText, error, describedBy);
  const [internal, setInternal] = React.useState(defaultChecked ?? false);
  const selected = checked ?? internal;
  return (
    <div className={cn('grid gap-2', disabled && 'opacity-40')}>
      <label
        htmlFor={field.fieldId}
        className="text-sm leading-5 font-medium text-text-1"
      >
        {label}
      </label>
      <div
        className={cn('flex items-center gap-3 text-xs text-text-2', className)}
      >
        <span className="relative inline-flex">
          <input
            {...props}
            id={field.fieldId}
            type="checkbox"
            role="switch"
            checked={selected}
            disabled={disabled}
            aria-describedby={field.describedBy}
            aria-invalid={Boolean(error)}
            onChange={(e) => {
              if (checked === undefined) setInternal(e.target.checked);
              onChange?.(e);
            }}
            className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <span
            className={cn(
              'h-6 w-10 rounded-full bg-raised ring-1 ring-input-border peer-checked:bg-green-2 peer-focus-visible:ring-2 peer-focus-visible:ring-green-2',
              error && 'ring-danger peer-focus-visible:ring-danger',
            )}
          />
          <span className="pointer-events-none absolute left-1 top-1 size-4 rounded-full bg-text-2 transition-transform motion-reduce:transition-none peer-checked:translate-x-4 peer-checked:bg-card" />
        </span>
        <span aria-hidden="true">{selected ? 'Enabled' : 'Disabled'}</span>
      </div>
      <FieldMessage
        id={field.messageId}
        helperText={helperText}
        error={error}
      />
    </div>
  );
}
