'use client';
import * as React from 'react';
import styles from './slider.module.css';
import { cn, FieldLabel, FieldMessage, useField } from './field';
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
  defaultValue = 0,
  className,
  onChange,
  disabled,
  min = 0,
  max = 100,
  style,
  'aria-describedby': describedBy,
  ...props
}: SliderProps) {
  const field = useField(id, helperText, error, describedBy);
  const [internal, setInternal] = React.useState(Number(defaultValue));
  const numeric = Number(value ?? internal);
  const start = Number(min);
  const end = Number(max);
  const percent =
    end > start
      ? Math.max(0, Math.min(100, ((numeric - start) / (end - start)) * 100))
      : 0;
  return (
    <div className={cn('group grid gap-2', disabled && 'opacity-40')}>
      {label && <FieldLabel htmlFor={field.fieldId}>{label}</FieldLabel>}
      <output
        htmlFor={field.fieldId}
        className={cn(
          'w-fit rounded-inner border border-input-border bg-raised px-4 py-2 text-xs leading-4 text-text-1 group-focus-within:border-green-2',
          error && 'border-danger text-danger group-focus-within:border-danger',
        )}
      >
        {numeric}%
      </output>
      <input
        {...props}
        id={field.fieldId}
        type="range"
        min={min}
        max={max}
        value={numeric}
        disabled={disabled}
        aria-describedby={field.describedBy}
        aria-invalid={Boolean(error)}
        onChange={(e) => {
          if (value === undefined) setInternal(Number(e.target.value));
          onChange?.(e);
        }}
        style={
          {
            ...style,
            '--slider-progress': `${percent}%`,
          } as React.CSSProperties
        }
        className={cn(
          styles.range,
          'h-2 w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-2 disabled:cursor-not-allowed',
          error && 'focus-visible:outline-danger',
          className,
        )}
      />
      <div className="flex justify-between text-xs text-text-2">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
      <FieldMessage
        id={field.messageId}
        helperText={helperText}
        error={error}
      />
    </div>
  );
}
