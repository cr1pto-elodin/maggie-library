import { BadGatewayException, BadRequestException } from '@nestjs/common';
import type { SemanticSearchConfig } from '../../config/semantic-search.config.js';
import { DocumentsRepository } from '../../repositories/documents.repository.js';
import { OllamaEmbeddingService } from '../ollama-embedding/ollama-embedding.service.js';
import { SemanticSearchService } from './semantic-search.service.js';

const documentId = '550e8400-e29b-41d4-a716-446655440000';
const embedding = Array.from({ length: 768 }, (_, index) => index / 768);

describe('SemanticSearchService', () => {
  it('uses configured defaults and searches with the query embedding', async () => {
    const results = [createResult()];
    const repository = { search: vi.fn().mockResolvedValue(results) };
    const embeddingService = {
      embed: vi.fn().mockResolvedValue({
        model: 'embeddinggemma',
        embeddings: [embedding],
      }),
    };
    const service = createService(repository, embeddingService);

    await expect(
      service.search({ query: '  Como funciona o RAG?  ' }),
    ).resolves.toEqual({
      model: 'embeddinggemma',
      topK: 5,
      minScore: 0.5,
      results,
    });
    expect(embeddingService.embed).toHaveBeenCalledWith([
      'Como funciona o RAG?',
    ]);
    expect(repository.search).toHaveBeenCalledWith({
      embedding,
      embeddingModel: 'embeddinggemma',
      embeddingDimensions: 768,
      topK: 5,
      minScore: 0.5,
      documentIds: undefined,
    });
  });

  it('accepts bounded overrides and removes duplicate document filters', async () => {
    const repository = { search: vi.fn().mockResolvedValue([]) };
    const service = createService(repository, {
      embed: vi.fn().mockResolvedValue({
        model: 'embeddinggemma',
        embeddings: [embedding],
      }),
    });

    await expect(
      service.search({
        query: 'Pergunta',
        topK: 10,
        minScore: -0.2,
        documentIds: [documentId, documentId],
      }),
    ).resolves.toMatchObject({ topK: 10, minScore: -0.2, results: [] });
    expect(repository.search).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 10,
        minScore: -0.2,
        documentIds: [documentId],
      }),
    );
  });

  it.each([
    [undefined],
    [null],
    [{}],
    [{ query: '' }],
    [{ query: 'a'.repeat(2_001) }],
    [{ query: 'Pergunta', topK: 0 }],
    [{ query: 'Pergunta', topK: 1.5 }],
    [{ query: 'Pergunta', topK: 21 }],
    [{ query: 'Pergunta', minScore: -1.1 }],
    [{ query: 'Pergunta', minScore: 1.1 }],
    [{ query: 'Pergunta', documentIds: [] }],
    [{ query: 'Pergunta', documentIds: ['invalid'] }],
  ])('rejects an invalid request: %j', async (input) => {
    const repository = { search: vi.fn() };
    const embeddingService = { embed: vi.fn() };
    const service = createService(repository, embeddingService);

    await expect(service.search(input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(embeddingService.embed).not.toHaveBeenCalled();
    expect(repository.search).not.toHaveBeenCalled();
  });

  it('translates embedding failures to bad gateway', async () => {
    const service = createService(
      { search: vi.fn() },
      { embed: vi.fn().mockRejectedValue(new Error('Ollama unavailable')) },
    );

    await expect(service.search({ query: 'Pergunta' })).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    await expect(service.search({ query: 'Pergunta' })).rejects.toThrow(
      'Não foi possível gerar o embedding da pergunta usando o Ollama.',
    );
  });

  it('rejects an embedding with an incompatible dimension', async () => {
    const repository = { search: vi.fn() };
    const service = createService(repository, {
      embed: vi.fn().mockResolvedValue({
        model: 'other-model',
        embeddings: [[0.1, 0.2]],
      }),
    });

    await expect(service.search({ query: 'Pergunta' })).rejects.toThrow(
      'O modelo de embeddings precisa retornar 768 dimensões.',
    );
    expect(repository.search).not.toHaveBeenCalled();
  });
});

function createService(
  repository: { search: ReturnType<typeof vi.fn> },
  embeddingService: { embed: ReturnType<typeof vi.fn> },
) {
  const config: SemanticSearchConfig = {
    defaultTopK: 5,
    maxTopK: 20,
    defaultMinScore: 0.5,
  };

  return new SemanticSearchService(
    repository as unknown as DocumentsRepository,
    embeddingService as unknown as OllamaEmbeddingService,
    config,
  );
}

function createResult() {
  return {
    chunkId: '650e8400-e29b-41d4-a716-446655440000',
    documentId,
    documentName: 'library.pdf',
    chunkIndex: 0,
    pageNumber: 1,
    content: 'Trecho relevante',
    score: 0.82,
  };
}
