import { describe, it, expect } from 'vitest';

describe('Environment Config', () => {
  it('should load JWT_SECRET from env', async () => {
    const { config } = await import('@/config/env');
    expect(config.jwtSecret).toBeDefined();
    expect(typeof config.jwtSecret).toBe('string');
  });

  it('should load PORT from env', async () => {
    const { config } = await import('@/config/env');
    expect(config.port).toBeDefined();
    expect(typeof config.port).toBe('number');
  });

  it('should load JWT_EXPIRES_IN from env', async () => {
    const { config } = await import('@/config/env');
    expect(config.jwtExpiresIn).toBeDefined();
    expect(typeof config.jwtExpiresIn).toBe('string');
  });
});
