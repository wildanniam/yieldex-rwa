/**
 * All on-screen copy in one place so the film can be re-voiced or localized.
 * Numbers follow the PRD's hypothetical example (docs/product.md §4).
 */
export const copy = {
  origin: {
    earn: 'Your tokenized stocks earn income.',
    slow: 'Slowly. Over months.',
    need: 'Need cash today?',
    sell: 'Selling means giving up the asset.',
    whatIf: ['What if you could sell', 'just the income?'],
    principal: ['Principal', 'Stays yours'],
    right: ['Income right', 'Fixed term · tradable'],
    definition:
      'A marketplace for time-limited income rights on tokenized stocks.',
  },
  market: {
    lock: 'Lock the shares. Keep the ownership.',
    terms: 'Set your terms. Sell a share of the income.',
    buy: 'Bob buys the income right.',
    clock: 'Paid upfront. The clock starts now.',
    income: 'Income arrives. The contract splits it.',
    claim: 'Paid in the asset token. Claim anytime.',
    resale: 'Want out early? Resell the whole right.',
    deadline: 'New owner. Same deadline.',
    summary: 'Every share of income, accounted for.',
  },
  assistant: {
    headline: ['Not sure?', 'Ask Yieldex AI.'],
    prompt: 'Find income rights under 100 DemoUSD and explain the risks.',
    explain: [
      'You buy income, not the shares.',
      'Income can be lower, or zero.',
      'The price isn’t refunded at expiry.',
    ],
    note: 'Read-only quotes · No automatic swaps · Your wallet confirms',
  },
  numbers: {
    headline: ['The price is fixed.', 'The income isn’t.'],
    fine: 'Hypothetical DemoUSD-equivalent values · Not a forecast · Not a loan',
  },
  close: {
    headline: ['Backing, rights and claims,', 'enforced by smart contracts.'],
    proof: [
      'Live on Ethereum Sepolia',
      '7 contracts · source-verified on Sourcify',
      'Full lifecycle tested · 23 transactions',
    ],
    tagline: ['Your shares stay yours.', 'Your income has options.'],
    cta: 'Explore the Sepolia demo',
    fine: 'Testnet demo with simulated tokens. Not investment advice. Income is never guaranteed.',
  },
} as const;

/** Real contract event names from IIncomeRightsMarket.sol. */
export const LEDGER_EVENTS = [
  { name: 'ListingCreated', detail: 'Backing locked · offer open' },
  { name: 'ListingFilled', detail: '90 DemoUSD → Alice · right → Bob' },
  { name: 'IncomeAllocated', detail: '0.50 Alice · 0.50 Bob' },
  { name: 'RightsOwnerChanged', detail: 'Bob → Carol · expiry kept' },
  { name: 'IncomeClaimed', detail: 'Each claim to its owner' },
  { name: 'PrincipalReleased', detail: 'Backing back to Alice' },
] as const;

/** Sepolia market from deployments/sepolia.json. */
export const MARKET_ADDRESS = '0x25e2288d8fa689a1d9895a31b26130153f2dc76f';
