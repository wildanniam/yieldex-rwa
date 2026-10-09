import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, type ButtonVariant } from './button';
const render = (props: Parameters<typeof Button>[0] = {}) =>
  renderToStaticMarkup(createElement(Button, props, 'Continue'));
describe('Button native contract', () => {
  it('does not accidentally submit a form and preserves explicit submit', () => {
    expect(render()).toContain('type="button"');
    expect(render({ type: 'submit' })).toContain('type="submit"');
  });
  it('disables a loading action but retains label and accessible busy state', () => {
    for (const variant of [
      'primary',
      'accent',
      'outline',
      'ghost',
    ] as ButtonVariant[]) {
      const html = render({ variant, isLoading: true });
      expect(html).toContain('disabled=""');
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('data-loading="true"');
      expect(html).toContain('Continue');
      expect(html).toContain(
        `/ui/loader-${variant === 'primary' ? 'primary' : variant === 'accent' ? 'accent' : 'neutral'}.svg`,
      );
    }
  });
  it('preserves native semantics and decorative icons', () => {
    const html = render({
      disabled: true,
      leadingIcon: 'wallet',
      'aria-label': 'Connect wallet',
    });
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-label="Connect wallet"');
    expect(html).toContain('/icons/wallet.svg');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('aria-busy="true"');
  });
});
