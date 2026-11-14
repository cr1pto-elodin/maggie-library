import { documentsConfig } from './documents.config.js';

describe('documentsConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loads the default document settings', () => {
    vi.stubEnv('DOCUMENT_MAX_FILE_SIZE_BYTES', undefined);
    vi.stubEnv('DOCUMENT_CHUNK_SIZE', undefined);
    vi.stubEnv('DOCUMENT_CHUNK_OVERLAP', undefined);

    expect(documentsConfig()).toEqual({
      maxFileSizeBytes: 10 * 1024 * 1024,
      chunkSize: 1_200,
      chunkOverlap: 200,
    });
  });

  it('rejects an overlap greater than or equal to the chunk size', () => {
    vi.stubEnv('DOCUMENT_CHUNK_SIZE', '200');
    vi.stubEnv('DOCUMENT_CHUNK_OVERLAP', '200');

    expect(() => documentsConfig()).toThrow(
      'DOCUMENT_CHUNK_OVERLAP precisa ser menor que DOCUMENT_CHUNK_SIZE.',
    );
  });

  it('rejects invalid positive integer settings', () => {
    vi.stubEnv('DOCUMENT_CHUNK_SIZE', 'invalid');

    expect(() => documentsConfig()).toThrow(
      'DOCUMENT_CHUNK_SIZE precisa ser um número inteiro positivo.',
    );
  });

  it('allows chunking without overlap', () => {
    vi.stubEnv('DOCUMENT_CHUNK_OVERLAP', '0');

    expect(documentsConfig().chunkOverlap).toBe(0);
  });
});
