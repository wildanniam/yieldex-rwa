'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  type ButtonVariant,
  type ButtonSize,
} from '@/components/ui/button';
import { GradientSamples } from '@/components/ui/gradient-samples';
import { Icon, ICON_NAMES } from '@/components/ui/icon';
import { TextInput, PasswordInput, AmountInput } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchField } from '@/components/ui/search-field';
import { Slider } from '@/components/ui/slider';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Checkbox } from '@/components/ui/checkbox';
import { Toggle } from '@/components/ui/toggle';
import { OTPInput } from '@/components/ui/otp-input';
import styles from './showcase.module.css';
const variants: ButtonVariant[] = ['primary', 'accent', 'outline', 'ghost'];
const sizes: ButtonSize[] = ['lg', 'md', 'sm'];
const states = [
  'Default',
  'Hover',
  'Pressed',
  'Focus',
  'Disabled',
  'Loading',
] as const;
const tokens = [
  'canvas',
  'canvas-deep',
  'card',
  'raised',
  'tint',
  'border',
  'text-1',
  'text-2',
  'text-3',
  'green-1',
  'green-2',
  'green-3',
  'green-text',
  'purple-1',
  'purple-2',
  'purple-3',
  'yellow',
  'danger',
  'input-border',
  'primary-label',
];
const roles = {
  primary: 'Core actions',
  accent: 'Entry & intelligence',
  outline: 'Secondary actions',
  ghost: 'Tertiary actions',
};
const dimensions = {
  lg: '48 px · padding 28 · label 16',
  md: '40 px · padding 24 · label 14',
  sm: '32 px · padding 16 · label 13',
};
export function DesignSystem() {
  const [state, setState] = useState('default');
  const [amount, setAmount] = useState('90');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState(
    'Coba tombol, keyboard, dan state form. Tidak ada transaksi yang dikirim.',
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const disabled = state === 'disabled';
  const error = state === 'error' ? 'Periksa kembali nilai ini.' : undefined;
  const fieldState = { disabled, ...(error ? { error } : {}) };
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <span>yieldex</span>
          <span>DESIGN SYSTEM / 01</span>
        </div>
        <h1>Components & foundations.</h1>
        <p>
          Komponen bersama untuk tim Yieldex. Warna, ukuran, dan interaksi
          mengikuti Figma; contoh di halaman ini tidak terhubung ke dana atau
          wallet.
        </p>
        <nav aria-label="Bagian design system" className={styles.tabs}>
          <a href="#buttons">Buttons</a>
          <a href="#forms">Forms</a>
          <a href="#foundations">Foundations</a>
          <a href="#icons">Icons</a>
          <a href="https://www.figma.com/design/XgSDQCwLb41j9XjTDwLtM2/Design-Yieldex?node-id=44-822">
            Figma ↗
          </a>
        </nav>
      </header>
      <section id="buttons" className={styles.section}>
        <div className={styles.heading}>
          <span>01 / A</span>
          <div>
            <h2>Buttons</h2>
            <p>
              4 hierarchies · 3 sizes · 6 states. Pill geometry, label 500, ikon
              20 px, gap 8 px.
            </p>
          </div>
        </div>
        <GradientSamples />
        <div className={styles.matrix}>
          <p className={styles.note}>
            State hover, pressed, dan focus di matriks adalah spesimen visual.
            Coba interaksi sesungguhnya pada playground di bawah.
          </p>
          {variants.map((variant) => (
            <section
              key={variant}
              aria-label={`${variant} button specimens`}
              className={styles.variant}
            >
              <div className={styles.variantTitle}>
                <h3>{variant}</h3>
                <span>{roles[variant]}</span>
              </div>
              {sizes.map((size) => (
                <div key={size} className={styles.sizeRow}>
                  <p className={styles.sizeLabel}>
                    {size.toUpperCase()} <span>{dimensions[size]}</span>
                  </p>
                  <div className={styles.stateGrid}>
                    {states.map((sample) => (
                      <div key={sample} className={styles.sample}>
                        <span>{sample}</span>
                        <Button
                          variant={variant}
                          size={size}
                          disabled={sample === 'Disabled'}
                          isLoading={sample === 'Loading'}
                          tabIndex={-1}
                          aria-label={`${variant} ${size} ${sample}`}
                          data-variant={variant}
                          data-state={sample.toLowerCase()}
                        >
                          Continue
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
        <div className={styles.playground}>
          <h3>Interaction playground</h3>
          <p>
            Klik atau gunakan Tab + Enter/Space. Loading menolak klik tambahan.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCount((c) => c + 1);
              setMessage('Submit contoh diterima. Tidak ada transaksi.');
            }}
          >
            <div className={styles.actions}>
              <Button type="submit" leadingIcon="arrow-right">
                Continue
              </Button>
              <Button
                variant="accent"
                leadingIcon="wallet"
                onClick={() =>
                  setMessage(
                    'Contoh wallet button diklik. Wallet tidak dibuka di katalog.',
                  )
                }
              >
                Connect wallet
              </Button>
              <Button
                variant="outline"
                trailingIcon="arrow-up-right"
                onClick={() => setMessage('Contoh detail diklik.')}
              >
                View details
              </Button>
              <Button
                variant="ghost"
                onClick={() => setMessage('Contoh dibatalkan.')}
              >
                Cancel
              </Button>
              <Button disabled onClick={() => setCount((c) => c + 1)}>
                Unavailable
              </Button>
              <Button
                isLoading={busy}
                onClick={() => {
                  setBusy(true);
                  setMessage('Memproses contoh…');
                  timer.current = setTimeout(() => {
                    setBusy(false);
                    setMessage(
                      'Contoh selesai. Tombol bisa digunakan kembali.',
                    );
                  }, 1200);
                }}
              >
                Test loading
              </Button>
            </div>
          </form>
          <p role="status">
            {message} <span>Submit count: {count}</span>
          </p>
        </div>
      </section>
      <section id="forms" className={styles.section}>
        <div className={styles.heading}>
          <span>01 / B</span>
          <div>
            <h2>Form controls</h2>
            <p>
              Field 48 px · radius 12 px. Klik untuk focus, isi untuk filled,
              atau ganti state bersama.
            </p>
          </div>
        </div>
        <div className={styles.statePicker}>
          <Select
            label="Form state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            options={[
              { label: 'Default / interactive', value: 'default' },
              { label: 'Error', value: 'error' },
              { label: 'Disabled', value: 'disabled' },
            ]}
          />
        </div>
        <div className={styles.formGrid}>
          <TextInput
            {...fieldState}
            label="Listing reference"
            placeholder="L-0142"
            helperText="Use a clear reference."
          />
          <PasswordInput
            {...fieldState}
            label="Password"
            placeholder="Password"
            autoComplete="off"
            helperText="Keep your account secure."
          />
          <AmountInput
            {...fieldState}
            label="Price"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onMax={() => setAmount('90')}
            simulatedUsd="90.00"
            balanceText="Balance: 90.00 DemoUSD (contoh)"
          />
          <Select
            {...fieldState}
            label="Backing asset"
            helperText="Token simulasi; pilihan ini hanya contoh UI."
            options={[
              { label: 'Choose asset', value: '' },
              { label: 'demoSPY', value: 'spy' },
              { label: 'demoMSFT', value: 'msft' },
              { label: 'demoAAPL', value: 'aapl' },
            ]}
          />
          <Slider
            {...fieldState}
            label="Income share"
            defaultValue={25}
            helperText="Principal stays with you."
          />
          <SegmentedControl
            {...fieldState}
            label="Term length"
            defaultValue="3"
            options={[
              { label: '1m', value: '1' },
              { label: '3m', value: '3' },
              { label: '6m', value: '6' },
              { label: '12m', value: '12' },
            ]}
            helperText="Starts at purchase."
          />
          <Checkbox
            {...fieldState}
            label="I understand all tokens are simulated."
            description="Required before continuing."
          />
          <Toggle
            {...fieldState}
            label="Activity alerts"
            helperText="Receive transaction updates (contoh UI)."
          />
          <OTPInput
            {...fieldState}
            label="Verification code"
            value={otp}
            onChange={setOtp}
            helperText="Contoh input saja; tidak mengirim kode."
          />
          <SearchField
            {...fieldState}
            label="Find a listing"
            placeholder="Search"
            helperText="Search assets or listing IDs (contoh UI)."
          />
        </div>
      </section>
      <section id="foundations" className={styles.section}>
        <div className={styles.heading}>
          <span>01 / C</span>
          <div>
            <h2>Foundations</h2>
            <p>
              Green untuk aksi utama. Purple untuk wallet dan AI. Yellow dan
              danger untuk status.
            </p>
          </div>
        </div>
        <div className={styles.swatches}>
          {tokens.map((token) => (
            <div key={token}>
              <div style={{ backgroundColor: `var(--${token})` }} />
              <code>{token}</code>
            </div>
          ))}
        </div>
        <div className={styles.typeSamples}>
          <span>Inter · self-hosted</span>
          <p>Income, on your terms.</p>
          <p>Keep your principal.</p>
          <p>Trade time-limited income rights</p>
          <p>
            90.00 DemoUSD <span> · tabular numbers</span>
          </p>
        </div>
      </section>
      <section id="icons" className={styles.section}>
        <div className={styles.heading}>
          <span>01 / D</span>
          <div>
            <h2>Iconography</h2>
            <p>
              40 ikon lokal · 20 × 20 px · stroke 1.5 px. Asset dan nama dipakai
              bersama di semua komponen.
            </p>
          </div>
        </div>
        <div className={styles.icons}>
          {ICON_NAMES.map((name) => (
            <div key={name}>
              <Icon name={name} size={20} />
              <code>{name}</code>
            </div>
          ))}
        </div>
      </section>
      <footer className={styles.footer}>
        <span>Yieldex / Component reference</span>
        <Link href="/lab">Buka functional marketplace lab →</Link>
      </footer>
    </main>
  );
}
