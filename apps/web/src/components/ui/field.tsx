import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const controlClasses =
  'h-12 w-full rounded-[12px] border border-input-border bg-card px-4 text-sm text-text-1 placeholder:text-text-3 focus:border-green-2 focus:outline-none focus:ring-1 focus:ring-green-2 disabled:cursor-not-allowed disabled:opacity-40';

export function FieldMessage({
  id,
  helperText,
  error,
}: {
  id?: string | undefined;
  helperText?: string | undefined;
  error?: string | undefined;
}) {
  const message = error ?? helperText;
  if (!message) return null;
  return (
    <p id={id} className={cn('text-xs text-text-3', error && 'text-danger')}>
      {message}
    </p>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-xs leading-[14px] text-text-2">
      {children}
    </label>
  );
}
