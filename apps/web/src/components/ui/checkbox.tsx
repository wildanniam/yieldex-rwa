'use client';
import * as React from 'react';
import { cn, FieldMessage } from './field';
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
  ...props
}: CheckboxProps) {
  return (
    <div className="grid gap-2">
      <label
        className={cn(
          'flex items-start gap-2 text-sm text-text-1',
          props.disabled && 'cursor-not-allowed opacity-40',
          className,
        )}
      >
        <input
          {...props}
          id={id}
          type="checkbox"
          className="mt-0.5 size-5 accent-green-2"
          aria-invalid={Boolean(error)}
        />
        <span>
          <span className="block">{label}</span>
          {description && (
            <span className="block text-xs text-text-3">{description}</span>
          )}
        </span>
      </label>
      <FieldMessage error={error} />
    </div>
  );
}
