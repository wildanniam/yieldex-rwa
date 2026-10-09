import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const uiRoot = resolve(__dirname, '../components/ui');
const source = (name: string) => readFileSync(resolve(uiRoot, name), 'utf8');

describe('form control contracts', () => {
  it('uses shared geometry and error/helper replacement', () => {
    const field = source('field.tsx');
    const input = source('input.tsx');
    expect(field).toContain('h-12 w-full rounded-[12px]');
    expect(field).toContain('border-input-border');
    expect(field).toContain('focus:border-green-2');
    expect(field).toContain('disabled:opacity-40');
    expect(input).toContain('error?: string');
    expect(field).toContain('const message = error ?? helperText');
    expect(field).toContain('text-danger');
  });

  it('covers all specialized controls and shared icons', () => {
    expect(source('input.tsx')).toContain("name={visible ? 'eye-off' : 'eye'}");
    expect(source('select.tsx')).toContain('chevron-down');
    expect(source('slider.tsx')).toContain('accent-green-1');
    expect(source('segmented-control.tsx')).toContain('role="radiogroup"');
    expect(source('checkbox.tsx')).toContain('type="checkbox"');
    expect(source('toggle.tsx')).toContain('role="switch"');
    expect(source('otp-input.tsx')).toContain('clipboardData');
    expect(source('search-field.tsx')).toContain('name="search"');
    expect(source('search-field.tsx')).toContain('⌘K');
  });
});
