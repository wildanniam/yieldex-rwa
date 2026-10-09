'use client';
import * as React from 'react';
import { Icon } from './icon';
import { cn, FieldMessage, useField } from './field';
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}
export function Checkbox({
  id,
  label,
  description,
  error,
  className,
  disabled,
  'aria-describedby': describedBy,
  ...props
}: CheckboxProps) {
  const field = useField(id, description, error, describedBy);
  return (
    <div className={cn('grid gap-2', disabled && 'opacity-40')}>
      <label
        htmlFor={field.fieldId}
        className={cn(
          'flex items-start gap-2 text-sm leading-5 text-text-1',
          disabled && 'cursor-not-allowed',
          className,
        )}
      >
        <span className="relative inline-flex size-5 shrink-0">
          <input
            {...props}
            id={field.fieldId}
            disabled={disabled}
            type="checkbox"
            aria-describedby={field.describedBy}
            aria-invalid={Boolean(error)}
            className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <span
            className={cn(
              'size-5 rounded-full border border-input-border bg-card peer-checked:border-green-2 peer-checked:bg-green-2 peer-focus-visible:ring-2 peer-focus-visible:ring-green-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas',
              error && 'border-danger peer-focus-visible:ring-danger',
            )}
          />
          <Icon
            name="check"
            size={20}
            alt=""
            inheritColor
            className="pointer-events-none absolute inset-0 hidden text-primary-label peer-checked:inline-block"
          />
        </span>
        <span>{label}</span>
      </label>
      <FieldMessage
        id={field.messageId}
        helperText={description}
        error={error}
      />
    </div>
  );
}
