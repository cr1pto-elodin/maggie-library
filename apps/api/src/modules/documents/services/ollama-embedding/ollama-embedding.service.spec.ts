import type { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import type { OllamaConfig } from '../../config/ollama.config.js';
import { OllamaEmbeddingService } from './ollama-embedding.service.js';

describe('OllamaEmbeddingService', () => {
  const config: OllamaConfig = {
    baseUrl: 'http://localhost:11434',
    chatModel: 'llama3.2:3b',
    embeddingModel: 'embeddinggemma',
    embeddingPath: '/api/embed',
  };

  it('sends text to Ollama and returns the embeddings', async () => {
    const response = {
      model: 'embeddinggemma',
      embeddings: [[0.1, 0.2]],
    };
    const httpService = createHttpService(response);
    const service = new OllamaEmbeddingService(httpService, config);

    await expect(service.embed(['Texto de teste'])).resolves.toEqual(response);
    expect(httpService.post).toHaveBeenCalledWith(
      'http://localhost:11434/api/embed',
      {
        model: 'embeddinggemma',
        input: ['Texto de teste'],
      },
    );
  });

  it('propagates HTTP errors', async () => {
    const httpService = {
      post: vi.fn().mockReturnValue(throwError(() => new Error('HTTP 500'))),
    } as unknown as HttpService;
    const service = new OllamaEmbeddingService(httpService, config);

    await expect(service.embed(['Texto de teste'])).rejects.toThrow('HTTP 500');
  });

  it('rejects an empty input before making an HTTP request', async () => {
    const httpService = createHttpService({});
    const service = new OllamaEmbeddingService(httpService, config);

    await expect(service.embed([])).rejects.toThrow(
      'Informe ao menos um texto para gerar embeddings.',
    );
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it('rejects an unexpected number of embeddings', async () => {
    const service = new OllamaEmbeddingService(
      createHttpService({ model: 'embeddinggemma', embeddings: [[0.1]] }),
      config,
    );

    await expect(service.embed(['Primeiro', 'Segundo'])).rejects.toThrow(
      'Ollama retornou uma quantidade inesperada de embeddings.',
    );
  });

  it('rejects a response without a valid model', async () => {
    const service = new OllamaEmbeddingService(
      createHttpService({ model: '', embeddings: [[0.1]] }),
      config,
    );

    await expect(service.embed(['Texto de teste'])).rejects.toThrow(
      'Ollama retornou uma resposta de embeddings inválida.',
    );
  });

  it('rejects embeddings with different dimensions', async () => {
    const service = new OllamaEmbeddingService(
      createHttpService({
        model: 'embeddinggemma',
        embeddings: [[0.1, 0.2], [0.3]],
      }),
      config,
    );

    await expect(service.embed(['Primeiro', 'Segundo'])).rejects.toThrow(
      'Ollama retornou embeddings com dimensões diferentes.',
    );
  });

  it('rejects non-numeric embeddings', async () => {
    const service = new OllamaEmbeddingService(
      createHttpService({
        model: 'embeddinggemma',
        embeddings: [['invalid']],
      }),
      config,
    );

    await expect(service.embed(['Texto de teste'])).rejects.toThrow(
      'Ollama retornou um embedding inválido.',
    );
  });
});

function createHttpService(data: unknown): HttpService {
  return {
    post: vi.fn().mockReturnValue(of({ data })),
  } as unknown as HttpService;
}
