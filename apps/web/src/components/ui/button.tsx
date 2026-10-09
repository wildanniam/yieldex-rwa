'use client';

import * as React from 'react';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Icon, type IconName } from '@/components/ui/icon';
import styles from './button.module.css';

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
  primary: 'bg-primary-gradient text-primary-label',
  accent: 'bg-accent-gradient text-white',
  outline: 'border border-[#505555] bg-transparent text-text-1',
  ghost: 'border border-transparent bg-transparent text-text-1',
};

const sizeStyles: Record<ButtonSize, string> = {
  lg: 'h-12 px-[28px] text-[16px] leading-6 gap-2',
  md: 'h-10 px-[24px] text-[14px] leading-5 gap-2',
  sm: 'h-8 px-[16px] text-[13px] leading-5 gap-2',
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
    'inline-flex shrink-0 items-center justify-center rounded-full font-medium cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-text focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-40 data-[loading=true]:opacity-100 data-[loading=true]:cursor-wait',
    styles.root,
    styles[variant],
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

function LoadingSpinner({ variant }: { variant: ButtonVariant }) {
  return (
    <Image
      src={`/ui/loader-${variant === 'primary' ? 'primary' : variant === 'accent' ? 'accent' : 'neutral'}.svg`}
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      className="shrink-0 animate-spin motion-reduce:animate-none"
    />
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
        {...props}
        ref={ref}
        aria-busy={isLoading || undefined}
        data-loading={isLoading || undefined}
        className={buttonVariants({
          variant,
          size,
          ...(className === undefined ? {} : { className }),
        })}
        disabled={isDisabled}
        type={type}
      >
        {isLoading ? (
          <LoadingSpinner variant={variant} />
        ) : (
          leadingIcon && (
            <Icon alt="" inheritColor name={leadingIcon} size={20} />
          )
        )}
        <span>{children}</span>
        {!isLoading && trailingIcon && (
          <span data-button-icon="trailing">
            <Icon alt="" inheritColor name={trailingIcon} size={20} />
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
