import { describe, expect, it } from 'vitest';
import { readWorkerConfig } from './config.js';

describe('worker startup config', () => {
  it('starts without any provider or signing credentials', () => {
    expect(readWorkerConfig({})).toEqual({ host: '127.0.0.1', port: 3101 });
  });
  it.each(['', '0', '65536', '-1', '3.1', '3101junk', ' 3101', '03101'])(
    'rejects invalid port %j',
    (port) => {
      expect(() => readWorkerConfig({ WORKER_PORT: port })).toThrow(
        'WORKER_PORT',
      );
    },
  );
  it('reads only its own safe configuration', () => {
    expect(
      readWorkerConfig({ WORKER_PORT: '3201', PRIVATE_KEY: 'not-a-key' }),
    ).toEqual({ host: '127.0.0.1', port: 3201 });
  });
});
