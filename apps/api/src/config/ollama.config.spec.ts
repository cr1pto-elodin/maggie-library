import { ollamaConfig } from './ollama.config.js';

describe('ollamaConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes a trailing slash in the Ollama URL', () => {
    vi.stubEnv('OLLAMA_URL', 'http://localhost:11434/');

    expect(ollamaConfig().baseUrl).toBe('http://localhost:11434');
  });

  it('rejects non-HTTP Ollama URLs', () => {
    vi.stubEnv('OLLAMA_URL', 'ftp://localhost:11434');

    expect(() => ollamaConfig()).toThrow(
      'OLLAMA_URL precisa usar o protocolo HTTP ou HTTPS.',
    );
  });

  it('rejects an empty embedding model', () => {
    vi.stubEnv('OLLAMA_EMBEDDING_MODEL', '   ');

    expect(() => ollamaConfig()).toThrow(
      'OLLAMA_EMBEDDING_MODEL não pode ser vazio.',
    );
  });
});
