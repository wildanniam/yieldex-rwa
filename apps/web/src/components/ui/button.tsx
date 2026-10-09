'use client';

import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Icon, type IconName } from '@/components/ui/icon';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-gradient text-canvas hover:bg-green-1 hover:bg-none active:bg-green-3 active:bg-none',
  accent:
    'bg-accent-gradient text-white hover:bg-purple-1 hover:bg-none active:bg-purple-3 active:bg-none',
  outline:
    'border border-[#505555] bg-transparent text-green-text hover:border-green-1 hover:text-green-1 active:border-green-3 active:text-green-3',
  ghost:
    'border border-transparent bg-transparent text-green-text hover:text-green-1 active:text-green-3',
};

const sizeStyles: Record<ButtonSize, string> = {
  lg: 'h-12 px-[28px] text-[16px] gap-2',
  md: 'h-10 px-[24px] text-[14px] gap-2',
  sm: 'h-8 px-[16px] text-[13px] gap-2',
};

export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-text focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none',
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

function LoadingSpinner() {
  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        fill="currentColor"
      />
    </svg>
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leadingIcon,
      trailingIcon,
      disabled = false,
      className,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        aria-busy={isLoading || undefined}
        className={buttonVariants({
          variant,
          size,
          ...(className === undefined ? {} : { className }),
        })}
        disabled={isDisabled}
        type={type}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          leadingIcon && (
            <Icon alt="" aria-hidden="true" name={leadingIcon} size={20} />
          )
        )}
        <span>{children}</span>
        {!isLoading && trailingIcon && (
          <Icon alt="" aria-hidden="true" name={trailingIcon} size={20} />
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
