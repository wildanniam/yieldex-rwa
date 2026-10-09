import { z } from 'zod';
import { validateData, type SchemaName } from '@rwa/shared/validation';

// Standard Schema is needed by BuiltInAgent. Shared JSON Schema remains authoritative.
function canonical<T extends z.ZodTypeAny>(
  name: SchemaName,
  schema: T,
): z.ZodEffects<T, z.output<T>, z.input<T>> {
  return schema.superRefine((value, ctx) => {
    if (!validateData(name, value).success)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          name === 'quote.QuoteRequest'
            ? 'Invalid quote request. HYPOTHETICAL_CHAINS needs at least two unique chainIds together in ONE call; originChainId may be null. ORIGIN_CHAIN needs one chain matching the known origin. Amount must be a positive uint256 string.'
            : 'Invalid domain input',
      });
  });
}
const atomic = z
  .string()
  .regex(/^[1-9][0-9]*$/)
  .max(78);
const bytes32 = z.string().regex(/^0x[0-9a-f]{64}$/);
const entity = z
  .string()
  .max(180)
  .refine((v) => validateData('common.EntityKey', v).success);
export const listingInput = z.object({ listingKey: entity }).strict();
export const positionInput = z.object({ positionKey: entity }).strict();
export const assetInput = z.object({ assetId: bytes32 }).strict();
export const searchInput = canonical(
  'api.SearchListingsQuery',
  z
    .object({
      assetIds: z.array(bytes32).max(10),
      market: z.enum(['PRIMARY', 'SECONDARY', 'ANY']),
      maxPriceAtomic: atomic.nullable(),
      maxRemainingDurationSeconds: z.number().int().positive().nullable(),
      incomeBpsMin: z.number().int().min(1).max(10000).nullable(),
      sort: z.enum(['PRICE_ASC', 'DURATION_ASC', 'NEWEST']),
      limit: z.number().int().min(1).max(20),
      cursor: z.string().nullable(),
    })
    .strict(),
);
const chain = z.union([z.literal(1), z.literal(42161), z.literal(8453)]);
export const quoteInput = canonical(
  'quote.QuoteRequest',
  z
    .object({
      requestId: z.string().uuid(),
      mode: z.enum(['EXACT_INPUT', 'EXACT_OUTPUT']),
      sellAssetId: z.enum(['ETH', 'USDC']),
      buyAssetId: z.enum(['ETH', 'USDC']),
      amountAtomic: atomic,
      originChainId: chain.nullable(),
      chainIds: z
        .array(chain)
        .min(1)
        .max(3)
        .describe(
          'All requested chains in one call. For Ethereum + Arbitrum + Base use [1,42161,8453]. HYPOTHETICAL_CHAINS requires at least two distinct chains.',
        ),
      comparisonScope: z.enum(['ORIGIN_CHAIN', 'HYPOTHETICAL_CHAINS']),
      slippageBps: z.number().int().min(0).max(500),
    })
    .strict(),
);
export const defaultSearch = {
  assetIds: [],
  market: 'ANY',
  maxPriceAtomic: null,
  maxRemainingDurationSeconds: null,
  incomeBpsMin: null,
  sort: 'NEWEST',
  limit: 20,
  cursor: null,
} as const;
