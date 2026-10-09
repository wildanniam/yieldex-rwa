'use client';
import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { cn, controlClasses, FieldLabel, FieldMessage } from './field';

export interface SelectOption {
  label: string;
  value: string;
}
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}
export function Select({
  id,
  label,
  helperText,
  error,
  options,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="grid gap-2">
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <div className="relative">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            controlClasses,
            'appearance-none pr-10',
            error && 'border-danger',
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={20}
          alt=""
          className="pointer-events-none absolute right-3 top-3"
        />
      </div>
      <FieldMessage helperText={helperText} error={error} />
    </div>
  );
}
