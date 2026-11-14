import { OllamaEmbeddingService } from './ollama-embedding.service.js';

describe('OllamaEmbeddingService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OLLAMA_TIMEOUT_MS;
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
        signal: expect.any(AbortSignal),
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

  it('uses the configured timeout', async () => {
    process.env.OLLAMA_TIMEOUT_MS = '15000';
    const timeoutSignal = new AbortController().signal;
    const timeoutSpy = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(timeoutSignal);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ model: 'embeddinggemma', embeddings: [[0.1]] }),
      ),
    );
    const service = new OllamaEmbeddingService();

    await service.embed(['Texto de teste']);

    expect(timeoutSpy).toHaveBeenCalledWith(15_000);
  });

  it('rejects an unexpected number of embeddings', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ model: 'embeddinggemma', embeddings: [[0.1]] }),
      ),
    );
    const service = new OllamaEmbeddingService();

    await expect(service.embed(['Primeiro', 'Segundo'])).rejects.toThrow(
      'Ollama retornou uma quantidade inesperada de embeddings.',
    );
  });

  it('rejects a response without a valid model', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ model: '', embeddings: [[0.1]] })),
    );
    const service = new OllamaEmbeddingService();

    await expect(service.embed(['Texto de teste'])).rejects.toThrow(
      'Ollama retornou uma resposta de embeddings inválida.',
    );
  });

  it('rejects embeddings with different dimensions', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          model: 'embeddinggemma',
          embeddings: [[0.1, 0.2], [0.3]],
        }),
      ),
    );
    const service = new OllamaEmbeddingService();

    await expect(service.embed(['Primeiro', 'Segundo'])).rejects.toThrow(
      'Ollama retornou embeddings com dimensões diferentes.',
    );
  });

  it('rejects non-numeric embeddings', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ model: 'embeddinggemma', embeddings: [['invalid']] }),
      ),
    );
    const service = new OllamaEmbeddingService();

    await expect(service.embed(['Texto de teste'])).rejects.toThrow(
      'Ollama retornou um embedding inválido.',
    );
  });
});
