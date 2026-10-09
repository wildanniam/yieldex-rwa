import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextInput, PasswordInput, AmountInput } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Toggle } from '../components/ui/toggle';
import { Slider } from '../components/ui/slider';
import { editOtp, pasteOtp } from '../components/ui/otp-value';
describe('shared form semantics', () => {
  it('generates labels/messages without requiring an id and replaces helper with error', () => {
    const html = renderToStaticMarkup(
      createElement(TextInput, {
        label: 'Reference',
        helperText: 'Normal helper',
        error: 'Invalid reference',
      }),
    );
    const id = html.match(/<input[^>]* id="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`for="${id}"`);
    expect(html).toContain(`aria-describedby="${id}-message"`);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('Invalid reference');
    expect(html).not.toContain('Normal helper');
    expect(html).not.toContain('undefined-message');
  });
  it('links select errors and retains caller descriptions', () => {
    const html = renderToStaticMarkup(
      createElement(Select, {
        id: 'asset',
        label: 'Asset',
        error: 'Choose an asset',
        'aria-describedby': 'external',
        options: [],
      }),
    );
    expect(html).toContain('aria-describedby="external asset-message"');
    expect(html).toContain('id="asset-message"');
  });
  it('disables all password/amount affordances with their field', () => {
    for (const component of [PasswordInput, AmountInput]) {
      const html = renderToStaticMarkup(
        createElement(component, { label: 'Field', disabled: true }),
      );
      expect(html.match(/disabled=""/g)?.length).toBe(2);
      expect(html).toContain('type="button"');
    }
  });
  it('initializes uncontrolled switch and range displays from default values', () => {
    expect(
      renderToStaticMarkup(
        createElement(Toggle, { label: 'Alerts', defaultChecked: true }),
      ),
    ).toContain('Enabled');
    expect(
      renderToStaticMarkup(
        createElement(Slider, { label: 'Share', defaultValue: 37 }),
      ),
    ).toContain('37%');
  });
  it('OTP deletion does not shift later digits; paste is bounded and filters text', () => {
    expect(editOtp('123456', 6, 2, '')).toBe('12 456');
    expect(editOtp('12 456', 6, 2, '9')).toBe('129456');
    expect(pasteOtp('12 456', 6, 2, 'a78-90')).toBe('127890');
    expect(pasteOtp('', 6, 0, '1234567')).toBe('123456');
    expect(pasteOtp('123', 6, 0, 'abc')).toBe('123');
  });
});
