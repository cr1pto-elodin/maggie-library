import {
  readHttpUrl,
  readNonEmptyString,
  readNonNegativeInteger,
  readPositiveInteger,
  readPostgresUrl,
} from './environment-reader.js';

describe('environmentReader', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads and validates integer values', () => {
    vi.stubEnv('POSITIVE_VALUE', '12');
    vi.stubEnv('NON_NEGATIVE_VALUE', '0');

    expect(readPositiveInteger('POSITIVE_VALUE', 1)).toBe(12);
    expect(readNonNegativeInteger('NON_NEGATIVE_VALUE', 1)).toBe(0);
  });

  it('rejects integers outside the accepted ranges', () => {
    vi.stubEnv('POSITIVE_VALUE', '0');
    vi.stubEnv('NON_NEGATIVE_VALUE', '-1');

    expect(() => readPositiveInteger('POSITIVE_VALUE', 1)).toThrow();
    expect(() => readNonNegativeInteger('NON_NEGATIVE_VALUE', 0)).toThrow();
  });

  it('normalizes HTTP URLs and accepts PostgreSQL URLs', () => {
    vi.stubEnv('HTTP_URL', 'http://localhost:3000/');
    vi.stubEnv('DATABASE_URL', 'postgresql://user:password@localhost:5432/db');

    expect(readHttpUrl('HTTP_URL', 'http://localhost')).toBe(
      'http://localhost:3000',
    );
    expect(readPostgresUrl('DATABASE_URL', 'postgresql://localhost/db')).toBe(
      'postgresql://user:password@localhost:5432/db',
    );
  });

  it('trims non-empty strings', () => {
    vi.stubEnv('MODEL_NAME', '  embeddinggemma  ');

    expect(readNonEmptyString('MODEL_NAME', 'fallback')).toBe('embeddinggemma');
  });
});
