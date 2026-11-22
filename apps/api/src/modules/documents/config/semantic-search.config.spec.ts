import { semanticSearchConfig } from './semantic-search.config.js';

describe('semanticSearchConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loads the default semantic search settings', () => {
    vi.stubEnv('SEMANTIC_SEARCH_TOP_K', undefined);
    vi.stubEnv('SEMANTIC_SEARCH_MAX_TOP_K', undefined);
    vi.stubEnv('SEMANTIC_SEARCH_MIN_SCORE', undefined);

    expect(semanticSearchConfig()).toEqual({
      defaultTopK: 5,
      maxTopK: 20,
      defaultMinScore: 0.5,
    });
  });

  it('rejects a default top-k greater than the maximum', () => {
    vi.stubEnv('SEMANTIC_SEARCH_TOP_K', '21');
    vi.stubEnv('SEMANTIC_SEARCH_MAX_TOP_K', '20');

    expect(() => semanticSearchConfig()).toThrow(
      'SEMANTIC_SEARCH_TOP_K precisa ser menor ou igual a SEMANTIC_SEARCH_MAX_TOP_K.',
    );
  });

  it('rejects a minimum score outside the cosine similarity range', () => {
    vi.stubEnv('SEMANTIC_SEARCH_MIN_SCORE', '-1.1');

    expect(() => semanticSearchConfig()).toThrow(
      'SEMANTIC_SEARCH_MIN_SCORE precisa ser um número entre -1 e 1.',
    );
  });
});
