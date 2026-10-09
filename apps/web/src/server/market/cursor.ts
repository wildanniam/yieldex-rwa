import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { ApiFailure } from '../http';
export type PageCursor = {
  v: 1;
  queryHash: string;
  blockNumber: string;
  blockHash: string;
  key: string[];
  id: string;
  expiresAt: number;
};
export const queryHash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export class Cursors {
  constructor(
    private secret: string,
    private now = () => Math.floor(Date.now() / 1000),
  ) {
    if (secret.length < 32)
      throw new Error('Cursor signing key must be configured');
  }
  encode(payload: PageCursor) {
    const value = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return Buffer.from(
      value +
        '.' +
        createHmac('sha256', this.secret).update(value).digest('base64url'),
    ).toString('base64url');
  }
  decode(token: string, hash: string): PageCursor {
    const invalid = () =>
      new ApiFailure(400, 'VALIDATION_ERROR', 'Cursor tidak valid.');
    if (token.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(token)) throw invalid();
    const decoded = Buffer.from(token, 'base64url');
    if (decoded.toString('base64url') !== token) throw invalid();
    const parts = decoded.toString().split('.');
    if (parts.length !== 2) throw invalid();
    const [value, signature] = parts as [string, string],
      expected = createHmac('sha256', this.secret).update(value).digest(),
      actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw invalid();
    let p: PageCursor;
    try {
      p = JSON.parse(Buffer.from(value, 'base64url').toString()) as PageCursor;
    } catch {
      throw invalid();
    }
    if (
      p.v !== 1 ||
      p.queryHash !== hash ||
      !/^\d+$/.test(p.blockNumber) ||
      !/^0x[0-9a-f]{64}$/.test(p.blockHash) ||
      !Array.isArray(p.key) ||
      !p.key.every((x) => typeof x === 'string') ||
      typeof p.id !== 'string' ||
      !Number.isSafeInteger(p.expiresAt)
    )
      throw invalid();
    if (this.now() >= p.expiresAt)
      throw new ApiFailure(
        410,
        'CURSOR_EXPIRED',
        'Cursor kedaluwarsa; mulai ulang pencarian.',
      );
    return p;
  }
}
