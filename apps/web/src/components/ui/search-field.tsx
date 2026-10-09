'use client';
import { Icon } from '@/components/ui/icon';
import { TextInput, type TextInputProps } from './input';
import { cn } from './field';
export interface SearchFieldProps extends TextInputProps {
  shortcut?: string;
}
export function SearchField({
  shortcut = '⌘K',
  className,
  ...props
}: SearchFieldProps) {
  return (
    <TextInput
      {...props}
      type="search"
      className={cn('pr-16', className)}
      startAdornment={<Icon name="search" size={20} alt="" />}
      endAdornment={
        <kbd
          aria-hidden="true"
          className="rounded-full bg-raised px-2 py-1 text-xs text-text-2"
        >
          {shortcut}
        </kbd>
      }
    />
  );
}
