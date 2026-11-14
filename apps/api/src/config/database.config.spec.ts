import { databaseConfig } from './database.config.js';

describe('databaseConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loads the default database settings', () => {
    vi.stubEnv('DATABASE_URL', undefined);
    vi.stubEnv('DATABASE_POOL_MAX', undefined);

    expect(databaseConfig()).toEqual({
      url: 'postgresql://maggie:maggie@localhost:5433/maggie_library',
      poolMax: 10,
    });
  });

  it('accepts both PostgreSQL URL protocols', () => {
    vi.stubEnv('DATABASE_URL', 'postgres://user:password@localhost:5432/db');

    expect(databaseConfig().url).toBe(
      'postgres://user:password@localhost:5432/db',
    );
  });

  it('rejects URLs for other protocols', () => {
    vi.stubEnv('DATABASE_URL', 'http://localhost:5432/maggie_library');

    expect(() => databaseConfig()).toThrow(
      'DATABASE_URL precisa usar o protocolo postgres ou postgresql.',
    );
  });
});
