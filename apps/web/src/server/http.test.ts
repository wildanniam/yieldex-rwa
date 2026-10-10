import { describe, expect, it, vi } from 'vitest';
import { apiError, ApiFailure } from './http';

describe('API failure diagnostics', () => {
  it('logs error categories and status without exposing provider credentials or SQL', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const error = Object.assign(
        new Error('https://provider/SECRET SELECT private'),
        {
          name: 'ContractFunctionExecutionError',
          cause: {
            name: 'HttpRequestError',
            status: 429,
            message: 'SECRET',
            url: 'SECRET',
          },
        },
      );
      const response = apiError(error, 'test-request');
      expect(response.status).toBe(503);
      expect(log).toHaveBeenCalledWith('market_api_failure', {
        requestId: 'test-request',
        causes: [
          { name: 'ContractFunctionExecutionError' },
          { name: 'HttpRequestError', status: 429 },
        ],
      });
      expect(JSON.stringify(log.mock.calls)).not.toContain('SECRET');
      expect(JSON.stringify(await response.json())).not.toContain('SECRET');
      apiError(new ApiFailure(400, 'VALIDATION_ERROR', 'Invalid'));
      expect(log).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });
});
