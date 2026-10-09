import Image from 'next/image';
import type { ReactNode } from 'react';
import styles from './background.module.css';

export function PlatformBackground({ children }: { children: ReactNode }) {
  return (
    <div className={styles.platform}>
      <div
        className={styles.background}
        aria-hidden="true"
        data-platform-background="true"
      >
        <Image
          src="/backgrounds/platform.png"
          alt=""
          fill
          sizes="100vw"
          preload
          className={styles.image}
        />
        <div className={styles.scrim} />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
