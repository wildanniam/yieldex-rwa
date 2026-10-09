import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiFailure } from '../http';
type Cursor = { scope: string; at: string; id: string; expiresAt: number };
export class HistoryCursor {
  constructor(
    private secret: string,
    private now = () => Math.floor(Date.now() / 1000),
  ) {
    if (secret.length < 32) throw new Error('Cursor secret required');
  }
  encode(scope: string, at: string, id: string) {
    const payload = JSON.stringify({
      scope,
      at,
      id,
      expiresAt: this.now() + 300,
    });
    return Buffer.from(
      JSON.stringify([
        payload,
        createHmac('sha256', this.secret).update(payload).digest('hex'),
      ]),
    ).toString('base64url');
  }
  decode(value: string, scope: string): Cursor {
    const invalid = () =>
      new ApiFailure(400, 'VALIDATION_ERROR', 'Cursor riwayat tidak valid.');
    if (value.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(value)) throw invalid();
    if (Buffer.from(value, 'base64url').toString('base64url') !== value)
      throw invalid();
    let payload: string, signature: string, c: Cursor;
    try {
      [payload, signature] = JSON.parse(
        Buffer.from(value, 'base64url').toString(),
      );
      if (
        typeof payload !== 'string' ||
        typeof signature !== 'string' ||
        !/^[a-f0-9]{64}$/.test(signature)
      )
        throw invalid();
      const expected = createHmac('sha256', this.secret)
        .update(payload)
        .digest();
      if (!timingSafeEqual(Buffer.from(signature, 'hex'), expected))
        throw invalid();
      c = JSON.parse(payload);
    } catch {
      throw invalid();
    }
    if (
      c.scope !== scope ||
      typeof c.at !== 'string' ||
      !Number.isFinite(Date.parse(c.at)) ||
      typeof c.id !== 'string' ||
      !/^[0-9a-f-]{36}$/.test(c.id) ||
      !Number.isSafeInteger(c.expiresAt)
    )
      throw invalid();
    if (c.expiresAt <= this.now())
      throw new ApiFailure(410, 'CURSOR_EXPIRED', 'Cursor kedaluwarsa.');
    return c;
  }
}
