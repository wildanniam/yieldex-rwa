import Image from 'next/image';
import type { ComponentProps } from 'react';

export const ICON_NAMES = [
  'alert-triangle',
  'arrow-left',
  'arrow-right',
  'arrow-up-right',
  'bell',
  'check-circle',
  'check',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'clock',
  'coins',
  'copy',
  'external-link',
  'eye-off',
  'eye',
  'filter',
  'globe',
  'history',
  'info',
  'key',
  'layout-grid',
  'layers',
  'list',
  'lock',
  'log-out',
  'mail',
  'plus',
  'receipt',
  'refresh',
  'search',
  'settings',
  'shield-check',
  'sparkles',
  'swap',
  'tag',
  'trash',
  'unlock',
  'user',
  'vault',
  'wallet',
  'x',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

type ImageProps = Pick<ComponentProps<typeof Image>, 'priority' | 'sizes'>;

export interface IconProps extends ImageProps {
  name: IconName;
  size?: number;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  inheritColor?: boolean;
}

function isIconName(value: string): value is IconName {
  return (ICON_NAMES as readonly string[]).includes(value);
}

export function Icon({
  name,
  size = 20,
  width,
  height,
  alt = name,
  className,
  inheritColor = false,
  priority,
  sizes,
}: IconProps) {
  if (!isIconName(name)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Icon] Unknown icon name: ${String(name)}`);
    }

    return <span aria-label={alt} className={className} role="img" />;
  }

  if (inheritColor) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={['inline-block', className].filter(Boolean).join(' ')}
        style={{
          flexShrink: 0,
          width: width ?? size,
          height: height ?? size,
          backgroundColor: 'currentColor',
          mask: `url(/icons/${name}.svg) center / contain no-repeat`,
        }}
      />
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={height ?? size}
      src={`/icons/${name}.svg`}
      width={width ?? size}
      {...(priority === undefined ? {} : { priority })}
      {...(sizes === undefined ? {} : { sizes })}
    />
  );
}
