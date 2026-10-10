'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import styles from '@/components/marketplace/marketplace.module.css';

export default function ListingNotFound() {
  return (
    <section className={`${styles.page} ${styles.empty}`}>
      <span className={styles.eyebrow}>Offer unavailable</span>
      <h1>This offer could not be found.</h1>
      <p>
        The link is invalid for this deployment. Choose an offer from the
        marketplace.
      </p>
      <Link href="/marketplace" className={buttonVariants({ size: 'md' })}>
        Back to marketplace
      </Link>
    </section>
  );
}
