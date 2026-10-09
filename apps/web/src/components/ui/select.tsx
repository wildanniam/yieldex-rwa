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
  disabled,
  'aria-describedby': describedBy,
  ...props
}: SelectProps) {
  const field = useField(id, helperText, error, describedBy);
  return (
    <div className={cn('grid gap-2 min-w-0', disabled && 'opacity-40')}>
      {label && <FieldLabel htmlFor={field.fieldId}>{label}</FieldLabel>}
      <div className="relative">
        <select
          {...props}
          id={field.fieldId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={field.describedBy}
          className={cn(
            controlClasses,
            'appearance-none pr-12 disabled:opacity-100',
            className,
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={20}
          alt=""
          className="pointer-events-none absolute right-4 top-[14px]"
        />
      </div>
      <FieldMessage
        id={field.messageId}
        helperText={helperText}
        error={error}
      />
    </div>
  );
}
