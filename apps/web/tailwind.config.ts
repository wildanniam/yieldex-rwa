import type { Config } from 'tailwindcss';

/**
 * Semantic Usage Rules:
 * - Green executes core actions (primary transactions, investments, claims).
 * - Purple supports entry and intelligence (wallet connection, AI insights).
 * - Yellow and Red remain semantic, never decorative (warnings and danger/errors).
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        card: '24px',
        inner: '16px',
        input: '12px',
      },
      colors: {
        canvas: 'var(--canvas)',
        'canvas-deep': 'var(--canvas-deep)',
        card: 'var(--card)',
        raised: 'var(--raised)',
        tint: 'var(--tint)',
        border: 'var(--border)',
        'input-border': 'var(--input-border)',
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        'green-1': 'var(--green-1)',
        'green-2': 'var(--green-2)',
        'green-3': 'var(--green-3)',
        'green-text': 'var(--green-text)',
        'purple-1': 'var(--purple-1)',
        'purple-2': 'var(--purple-2)',
        'purple-3': 'var(--purple-3)',
        yellow: 'var(--yellow)',
        danger: 'var(--danger)',
      },
      backgroundImage: {
        'primary-gradient':
          'linear-gradient(to bottom, #99E39E, #63C16B, #55B75E)',
        'accent-gradient':
          'linear-gradient(to bottom, #7C72FE, #6B62E0, #544CBB)',
      },
    },
  },
  plugins: [],
};

export default config;
