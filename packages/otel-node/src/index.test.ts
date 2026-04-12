import { afterEach, describe, expect, it, vi } from 'vitest';

describe('startOtel', () => {
  afterEach(() => {
    vi.resetModules();
    delete process.env.OTEL_SDK_DISABLED;
    delete process.env.OTEL_SERVICE_NAME;
    delete process.env.OTEL_SERVICE_NAMESPACE;
    delete process.env.OTEL_ENVIRONMENT;
  });

  it('returns without throwing when SDK is disabled (1)', async () => {
    process.env.OTEL_SDK_DISABLED = '1';
    const { startOtel } = await import('./index.js');
    expect(() => startOtel()).not.toThrow();
  });

  it('returns without throwing when SDK is disabled (true)', async () => {
    process.env.OTEL_SDK_DISABLED = 'true';
    const { startOtel } = await import('./index.js');
    expect(() => startOtel()).not.toThrow();
  });

  it('is a no-op when disabled: second call does not throw', async () => {
    process.env.OTEL_SDK_DISABLED = '1';
    const { startOtel } = await import('./index.js');
    startOtel();
    expect(() => startOtel()).not.toThrow();
  });
});
