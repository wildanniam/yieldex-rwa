import { randomBytes, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { createSiweMessage } from 'viem/siwe';
import { getAddress, type Hex } from 'viem';
import type postgres from 'postgres';
import { normalizeAddress } from '@rwa/shared/config';
import type { Session } from '@rwa/shared';
import { authProvider } from './provider';
import { ApiFailure } from '../http';
import type { User, Session as ProviderSession } from '@supabase/supabase-js';

type Config = {
  url: string;
  key: string;
  origin: string;
  chainId: 31337 | 11155111;
};
export function providerIdentity(
  user: User,
  expectedWallet: string,
  chainId: number,
  domain: string,
) {
  const identity = user.identities?.find(
    (i) =>
      i.provider === 'web3' &&
      i.id.toLowerCase() === `web3:ethereum:${expectedWallet}`,
  );
  const c = identity?.identity_data?.custom_claims;
  if (
    !c ||
    c.chain !== 'ethereum' ||
    typeof c.address !== 'string' ||
    c.address.toLowerCase() !== expectedWallet ||
    String(c.network) !== String(chainId) ||
    c.domain !== domain
  )
    throw new ApiFailure(
      403,
      'WALLET_MISMATCH',
      'Identitas wallet/chain tidak sesuai.',
    );
}
/** This only reads claims from an access token already verified by Supabase
 * getUser (or freshly returned by signInWithWeb3). Never use on unverified JWT.
 */
function verifiedTokenClaims(token: string, userId: string) {
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(
      Buffer.from(token.split('.')[1]!, 'base64url').toString(),
    );
  } catch {
    throw new ApiFailure(401, 'AUTH_REQUIRED', 'Session tidak valid.');
  }
  if (
    claims.sub !== userId ||
    typeof claims.session_id !== 'string' ||
    !/^[0-9a-f-]{36}$/.test(claims.session_id) ||
    !Number.isSafeInteger(claims.exp) ||
    Number(claims.exp) <= Math.floor(Date.now() / 1000)
  )
    throw new ApiFailure(401, 'SESSION_EXPIRED', 'Session kedaluwarsa.');
  return { sessionId: claims.session_id, expiresAt: Number(claims.exp) };
}
export class Web3Sessions {
  constructor(
    private db: ReturnType<typeof postgres>,
    readonly config: Config,
  ) {
    const u = new URL(config.origin);
    // Native SIWE rejects IP-literal domains, even for a valid signature.
    // Fail before creating a challenge or prompting the user's wallet.
    if (isIP(u.hostname.replace(/^\[|\]$/g, '')))
      throw new ApiFailure(
        503,
        'AUTH_UNAVAILABLE',
        'Verifikasi wallet belum tersedia pada alamat aplikasi ini.',
      );
    if (
      u.origin !== config.origin ||
      (u.hostname !== 'localhost' && u.protocol !== 'https:')
    )
      throw new Error('Explicit valid app origin required');
  }
  assertOrigin(origin: string | null) {
    if (origin !== this.config.origin)
      throw new ApiFailure(403, 'ORIGIN_MISMATCH', 'Origin tidak diizinkan.');
  }
  async challenge(wallet: string) {
    let who: string;
    try {
      who = normalizeAddress(wallet);
    } catch {
      throw new ApiFailure(
        400,
        'VALIDATION_ERROR',
        'Alamat wallet tidak valid.',
      );
    }
    const id = randomUUID(),
      nonce = randomBytes(24).toString('hex'),
      issuedAt = new Date(),
      expiresAt = new Date(issuedAt.getTime() + 300000),
      domain = new URL(this.config.origin).host;
    const message = createSiweMessage({
      domain,
      address: getAddress(who),
      statement:
        'Sign in to RWA Income Rights. This does not authorize any transaction.',
      uri: this.config.origin + '/',
      version: '1',
      chainId: this.config.chainId,
      nonce,
      issuedAt,
      expirationTime: expiresAt,
      requestId: id,
    });
    await this
      .db`insert into app_private.auth_challenges(id,wallet,chain_id,nonce,message,expires_at) values(${id},${who},${this.config.chainId},${nonce},${message},${expiresAt})`;
    return {
      challengeId: id,
      message,
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
      chainId: this.config.chainId,
      walletAddress: who,
    };
  }
  async exchange(
    challengeId: string,
    signature: Hex,
    browserChallengeId: string | undefined,
  ): Promise<ProviderSession> {
    if (
      !/^[0-9a-f-]{36}$/.test(challengeId) ||
      browserChallengeId !== challengeId ||
      !/^0x[0-9a-fA-F]{130}$/.test(signature)
    )
      throw new ApiFailure(
        400,
        'VALIDATION_ERROR',
        'Challenge atau signature tidak valid.',
      );
    return await this.db.begin(async (sql) => {
      const [c] =
        await sql`select *,expires_at>now() as fresh from app_private.auth_challenges where id=${challengeId} for update`;
      if (
        !c ||
        !c.fresh ||
        c.consumed_at ||
        Number(c.chain_id) !== this.config.chainId
      )
        throw new ApiFailure(
          401,
          'CHALLENGE_EXPIRED',
          'Challenge sudah digunakan atau kedaluwarsa.',
        );
      const client = authProvider(this.config.url, this.config.key);
      const { data, error } = await client.auth.signInWithWeb3({
        chain: 'ethereum',
        message: c.message as string,
        signature,
      });
      if (error || !data.session || !data.user)
        throw new ApiFailure(
          401,
          'AUTH_REQUIRED',
          'Verifikasi signature gagal.',
        );
      providerIdentity(
        data.user,
        c.wallet,
        this.config.chainId,
        new URL(this.config.origin).host,
      );
      const verified = verifiedTokenClaims(
        data.session.access_token,
        data.user.id,
      );
      await sql`insert into app_private.verified_sessions(session_id,user_id,wallet,chain_id,expires_at,challenge_id) values(${verified.sessionId},${data.user.id},${c.wallet},${this.config.chainId},now()+interval '24 hours',${challengeId})`;
      await sql`insert into public.wallet_identities(user_id,chain_namespace,wallet_address) values(${data.user.id},'eip155',${c.wallet}) on conflict(user_id,chain_namespace,wallet_address) do nothing`;
      await sql`update app_private.auth_challenges set consumed_at=now() where id=${challengeId}`;
      return data.session;
    });
  }
  async verify(accessToken: string): Promise<Session> {
    const { data, error } = await authProvider(
      this.config.url,
      this.config.key,
    ).auth.getUser(accessToken);
    if (error || !data.user)
      throw new ApiFailure(401, 'AUTH_REQUIRED', 'Login wallet diperlukan.');
    const c = verifiedTokenClaims(accessToken, data.user.id);
    const [s] = await this
      .db`select wallet,chain_id from app_private.verified_sessions where session_id=${c.sessionId} and user_id=${data.user.id} and expires_at>now() and revoked_at is null`;
    if (!s || Number(s.chain_id) !== this.config.chainId)
      throw new ApiFailure(
        401,
        'AUTH_REQUIRED',
        'Login melalui challenge aplikasi diperlukan.',
      );
    return {
      userId: data.user.id,
      walletAddress: s.wallet,
      authChainId: Number(s.chain_id),
      expiresAt: c.expiresAt,
    };
  }
  async revoke(accessToken: string) {
    const user = await this.verify(accessToken),
      c = verifiedTokenClaims(accessToken, user.userId);
    await this
      .db`update app_private.verified_sessions set revoked_at=now() where session_id=${c.sessionId} and user_id=${user.userId}`;
  }
}
