import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const controlClasses =
  'h-12 w-full rounded-[12px] border border-input-border bg-card px-4 text-sm leading-5 text-text-1 placeholder:text-text-3 focus:border-green-2 focus:outline-none focus:ring-1 focus:ring-green-2 aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger disabled:cursor-not-allowed disabled:opacity-40';
export function useField(
  id?: string,
  helperText?: string,
  error?: string,
  describedBy?: string,
) {
  const generated = React.useId();
  const fieldId = id ?? generated;
  const messageId = helperText || error ? `${fieldId}-message` : undefined;
  return {
    fieldId,
    messageId,
    describedBy:
      [describedBy, messageId].filter(Boolean).join(' ') || undefined,
  };
}
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
    <p
      id={id}
      className={cn('text-xs leading-4 text-text-2', error && 'text-danger')}
    >
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
    <label
      htmlFor={htmlFor}
      className="text-sm leading-5 font-medium text-text-1"
    >
      {children}
    </label>
  );
}
