import { afterEach, describe, expect, it, vi } from 'vitest';

describe('startOtel', () => {
  afterEach(() => {
    vi.resetModules();
    delete process.env.OTEL_SDK_DISABLED;
    delete process.env.OTEL_SERVICE_NAME;
  });

  it('returns without throwing when SDK is disabled', async () => {
    process.env.OTEL_SDK_DISABLED = '1';
    const { startOtel } = await import('./index.js');
    expect(() => startOtel()).not.toThrow();
  });
});
