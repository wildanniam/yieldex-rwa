// Browser-safe entry point. Import validation/ABI explicitly when needed.
export type * from './generated/types.js';

export const INTERFACE_VERSION = '1.0' as const;
export const STARTER_STAGE = 'FOUNDATION_ONLY' as const;

// Separate environment identities; these are not deployed asset/address manifests.
export const CHAIN_IDS = {
  local: 31337,
  demo: 11155111,
  quote: [1, 42161, 8453],
} as const;
