'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, useSpring } from 'motion/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useAssistant } from '@/components/ChatbotWrapper';
import s from './landing.module.css';

export function LinkAction({
  children,
  href,
  outline = false,
}: {
  children: ReactNode;
  href: string;
  outline?: boolean;
}) {
  return (
    <Link
      href={href}
      data-action={outline ? 'outline' : 'primary'}
      className={buttonVariants({
        variant: outline ? 'outline' : 'primary',
        size: 'lg',
      })}
    >
      {children}
      <span data-button-icon="trailing">
        <Icon
          name={outline ? 'arrow-right' : 'arrow-up-right'}
          alt=""
          inheritColor
        />
      </span>
    </Link>
  );
}

export function AskAssistant({
  children = 'Ask Yieldex',
  compact = false,
}: {
  children?: ReactNode;
  compact?: boolean;
}) {
  const assistant = useAssistant();
  return (
    <Button
      variant="accent"
      size={compact ? 'sm' : 'md'}
      leadingIcon="sparkles"
      isLoading={assistant.busy}
      onClick={assistant.open}
    >
      {children}
    </Button>
  );
}
// Progressive enhancement: static/SSR content stays visible without JavaScript.
export function SectionMotion() {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced !== false || typeof IntersectionObserver === 'undefined')
      return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (entry.boundingClientRect.top < 120) continue;
          animations.push(
            entry.target.animate(
              [
                { opacity: 0.55, translate: '0 18px' },
                { opacity: 1, translate: '0 0' },
              ],
              { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' },
            ),
          );
        }
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll('[data-landing-reveal]')
      .forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, [reduced]);
  return null;
}

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const links = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    links.current?.querySelector('a')?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !links.current?.contains(event.target) &&
        !trigger.current?.contains(event.target)
      )
        setOpen(false);
    };
    const media = matchMedia('(min-width: 901px)');
    const resize = () => {
      if (media.matches) setOpen(false);
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    media.addEventListener('change', resize);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
      media.removeEventListener('change', resize);
    };
  }, [open]);
  return (
    <header className={s.nav}>
      <div className={s.navInner}>
        <a href="#top" aria-label="Yieldex home" className={s.logo}>
          <Image
            src="/landing/yieldex-logo.png"
            alt="Yieldex"
            width={117}
            height={36}
            priority
          />
        </a>
        <nav
          ref={links}
          id="landing-navigation"
          aria-label="Main navigation"
          data-open={open}
          className={s.navLinks}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) setOpen(false);
          }}
        >
          <a href="#why-yieldex">Why Yieldex</a>
          <a href="#how-it-works">How it works</a>
          <a href="#calculator">The numbers</a>
          <a href="#assistant">AI Assistant</a>
        </nav>
        <div className={s.navActions}>
          <Link
            href="/lab"
            data-action="primary"
            className={buttonVariants({ size: 'sm' })}
          >
            Launch app <Icon name="arrow-up-right" alt="" inheritColor />
          </Link>
          <button
            ref={trigger}
            type="button"
            className={s.menuToggle}
            aria-expanded={open}
            aria-controls="landing-navigation"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <noscript>
        <nav className={s.noScriptNav}>
          <a href="#how-it-works">How it works</a>
          <a href="#calculator">The numbers</a>
          <a href="/lab">Open demo</a>
        </nav>
      </noscript>
    </header>
  );
}

const stages = ['List income', 'Receive upfront', 'Share dividends'] as const;
export function ProductPreview() {
  const [stage, setStage] = useState(0);
  const reduced = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 150, damping: 24 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 24 });
  return (
    <section
      className={s.preview}
      aria-label="Illustrative income-rights lifecycle"
    >
      <div className={s.previewTop}>
        <span>
          <i /> One asset. Two opportunities.
        </span>
        <span>Interactive example · No transaction</span>
      </div>
      <div className={s.previewScene}>
        <div className={s.backingCard}>
          <div className={s.cardKicker}>
            <Icon name="vault" alt="" inheritColor />
            <span>ALICE’S BACKING</span>
          </div>
          <div className={s.assetMonogram}>
            A<span>DEMO</span>
          </div>
          <h3>
            100 <span>demoAAPL</span>
          </h3>
          <p>The asset stays hers.</p>
          <div className={s.backingDivider} />
          <div className={s.miniRow}>
            <span>Ownership</span>
            <strong>Alice</strong>
          </div>
          <div className={s.miniRow}>
            <span>Backing</span>
            <strong>
              <Icon name="lock" alt="" inheritColor size={14} /> Locked
            </strong>
          </div>
          <div className={s.principalLine}>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <small>Released after expiry and safe accounting.</small>
        </div>
        <div className={s.listingPerspective}>
          <motion.div
            className={s.listingCard}
            style={{
              rotateX: reduced ? 0 : rotateX,
              rotateY: reduced ? 0 : rotateY,
              transformPerspective: 1000,
            }}
            onPointerMove={(event) => {
              if (event.pointerType !== 'mouse' || reduced !== false) return;
              const rect = event.currentTarget.getBoundingClientRect();
              rotateX.set(
                -((event.clientY - rect.top) / rect.height - 0.5) * 6,
              );
              rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * 8);
            }}
            onPointerLeave={() => {
              rotateX.set(0);
              rotateY.set(0);
            }}
          >
            <div className={s.listingHeader}>
              <div>
                <span className={s.assetDot}>A</span>
                <div>
                  <strong>demoAAPL</strong>
                  <small>Income rights</small>
                </div>
              </div>
              <span className={s.exampleBadge}>EXAMPLE</span>
            </div>
            <div className={s.price}>
              <span>Fixed upfront price</span>
              <p>
                90<span>DemoUSD</span>
              </p>
            </div>
            <div className={s.listingFacts}>
              <div>
                <span>Income share</span>
                <strong>
                  50<span>%</span>
                </strong>
              </div>
              <div>
                <span>Term at purchase</span>
                <strong>
                  6 <span>months</span>
                </strong>
              </div>
            </div>
            <div className={s.splitTrack} aria-hidden="true">
              <span />
              <span />
            </div>
            <div className={s.splitLabels}>
              <span>50% stays with Alice</span>
              <span>50% goes to buyer</span>
            </div>
            <Button
              className={s.previewAction}
              leadingIcon={stage === 2 ? 'refresh' : 'arrow-right'}
              onClick={() => setStage((v) => (v + 1) % 3)}
            >
              {stage === 0
                ? 'Preview purchase'
                : stage === 1
                  ? 'Preview a dividend'
                  : 'Replay example'}
            </Button>
            <p className={s.previewDisclaimer}>
              A sale of income. Never a sale of the principal.
            </p>
          </motion.div>
        </div>
        <div className={s.receiptCard} aria-live="polite" aria-atomic="true">
          <div className={s.cardKicker}>
            <Icon
              name={stage === 2 ? 'coins' : 'receipt'}
              alt=""
              inheritColor
            />
            <span>{stage === 2 ? 'INCOME ALLOCATION' : 'THE OTHER SIDE'}</span>
          </div>
          <motion.div
            key={stage}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className={s.receiptContent}
          >
            <div className={s.receiptIcon}>
              <Icon
                name={stage === 0 ? 'clock' : 'check'}
                size={24}
                alt=""
                inheritColor
              />
            </div>
            <h3>
              {stage === 0
                ? 'Ready when you are.'
                : stage === 1
                  ? '90 DemoUSD'
                  : '0.50 demoAAPL'}
            </h3>
            <p>
              {stage === 0
                ? 'A buyer accepts the fixed price. That’s when the term begins.'
                : stage === 1
                  ? 'Paid upfront to Alice. Bob now holds 50% of the income rights.'
                  : 'Allocated to Bob from a hypothetical 1 demoAAPL dividend.'}
            </p>
            <div className={s.receiptBottom}>
              <span>{stage === 2 ? 'Alice’s income' : 'Buyer gets'}</span>
              <strong>
                {stage === 2 ? '0.50 demoAAPL' : 'Income, not shares'}
              </strong>
            </div>
          </motion.div>
          <small>
            {stage === 0
              ? 'No borrowing. No principal repayment.'
              : stage === 1
                ? 'Six months starts at purchase.'
                : 'Payouts are in-kind. Income is not guaranteed.'}
          </small>
        </div>
      </div>
      <div className={s.previewSteps} aria-label="Preview stages">
        {stages.map((label, index) => (
          <button
            key={label}
            aria-pressed={stage === index}
            onClick={() => setStage(index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {label}
            {stage === index && (
              <motion.i
                layoutId="preview-indicator"
                transition={{ duration: reduced ? 0 : 0.25 }}
              />
            )}
          </button>
        ))}
      </div>
      <noscript>
        <p className={s.finePrint}>
          Example: a buyer pays 90 DemoUSD, then receives 50% of any income
          during the six-month term. Actual payouts are in demoAAPL.
        </p>
      </noscript>
    </section>
  );
}
