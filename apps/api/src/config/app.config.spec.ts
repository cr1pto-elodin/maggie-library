import { appConfig } from './app.config.js';

describe('appConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes the API prefix', () => {
    vi.stubEnv('API_PREFIX', '/api/');

    expect(appConfig().apiPrefix).toBe('api');
  });

  it('rejects an empty normalized API prefix', () => {
    vi.stubEnv('API_PREFIX', '/');

    expect(() => appConfig()).toThrow(
      'API_PREFIX precisa conter ao menos um caractere.',
    );
  });

  it('rejects an invalid CORS origin', () => {
    vi.stubEnv('CORS_ORIGIN', 'invalid');

    expect(() => appConfig()).toThrow(
      'CORS_ORIGIN precisa ser uma URL válida.',
    );
  });
});
