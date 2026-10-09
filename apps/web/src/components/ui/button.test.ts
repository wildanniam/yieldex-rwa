import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buttonVariants } from './button';

const buttonSource = readFileSync(resolve(__dirname, 'button.tsx'), 'utf8');

describe('Button component contract', () => {
  it('exports the approved hierarchy and size classes', () => {
    expect(buttonVariants({ variant: 'primary', size: 'lg' })).toContain(
      'bg-primary-gradient',
    );
    expect(buttonVariants({ variant: 'accent', size: 'md' })).toContain(
      'bg-accent-gradient',
    );
    expect(buttonVariants({ variant: 'outline', size: 'sm' })).toContain(
      'border-[#505555]',
    );
    expect(buttonVariants({ variant: 'ghost', size: 'md' })).toContain(
      'border-transparent',
    );
    expect(buttonVariants({ size: 'lg' })).toContain('h-12');
    expect(buttonVariants({ size: 'lg' })).toContain('px-[28px]');
    expect(buttonVariants({ size: 'lg' })).toContain('text-[16px]');
    expect(buttonVariants({ size: 'md' })).toContain('h-10');
    expect(buttonVariants({ size: 'md' })).toContain('px-[24px]');
    expect(buttonVariants({ size: 'md' })).toContain('text-[14px]');
    expect(buttonVariants({ size: 'sm' })).toContain('h-8');
    expect(buttonVariants({ size: 'sm' })).toContain('px-[16px]');
    expect(buttonVariants({ size: 'sm' })).toContain('text-[13px]');
  });

  it('includes shared geometry, focus, and disabled contracts', () => {
    const classes = buttonVariants();

    expect(classes).toContain('rounded-full');
    expect(classes).toContain('font-medium');
    expect(classes).toContain('gap-2');
    expect(classes).toContain('focus-visible:ring-green-text');
    expect(classes).toContain('focus-visible:ring-offset-canvas');
    expect(classes).toContain('disabled:opacity-40');
    expect(classes).toContain('disabled:cursor-not-allowed');
  });

  it('uses the shared Icon component and loading behavior', () => {
    expect(buttonSource).toContain("from '@/components/ui/icon'");
    expect(buttonSource).toContain('leadingIcon?: IconName');
    expect(buttonSource).toContain('trailingIcon?: IconName');
    expect(buttonSource).toContain('isLoading = false');
    expect(buttonSource).toContain('<LoadingSpinner />');
    expect(buttonSource).toContain('disabled={isDisabled}');
    expect(buttonSource).not.toContain('magnetic');
    expect(buttonSource).not.toContain('borderBeam');
    expect(buttonSource).not.toContain('ambientGlow');
  });
});
