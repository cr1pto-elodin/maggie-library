import { OllamaEmbeddingService } from './ollama-embedding.service.js';

describe('OllamaEmbeddingService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends text to Ollama and returns the embeddings', async () => {
    const response = {
      model: 'embeddinggemma',
      embeddings: [[0.1, 0.2]],
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(response)));
    const service = new OllamaEmbeddingService();

    await expect(service.embed(['Texto de teste'])).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/embed',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'embeddinggemma',
          input: ['Texto de teste'],
        }),
      }),
    );
  });

  it('throws when Ollama returns an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 500 }),
    );
    const service = new OllamaEmbeddingService();

    await expect(service.embed(['Texto de teste'])).rejects.toThrow(
      'Ollama respondeu com status 500.',
    );
  });
});
