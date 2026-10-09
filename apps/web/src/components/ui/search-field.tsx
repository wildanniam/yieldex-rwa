'use client';
import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { cn, controlClasses, FieldLabel, FieldMessage } from './field';
export interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  shortcut?: string;
}
export function SearchField({
  id,
  label,
  helperText,
  error,
  shortcut = '⌘K',
  className,
  ...props
}: SearchFieldProps) {
  return (
    <div className="grid gap-2">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <div className="relative">
        <Icon
          name="search"
          size={20}
          alt=""
          className="pointer-events-none absolute left-3 top-3"
        />
        <input
          {...props}
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            controlClasses,
            'pl-10 pr-14',
            error && 'border-danger',
            className,
          )}
        />
        <kbd className="absolute right-3 top-3 rounded bg-raised px-1.5 py-1 text-[11px] text-text-2">
          {shortcut}
        </kbd>
      </div>
      <FieldMessage helperText={helperText} error={error} />
    </div>
  );
}
