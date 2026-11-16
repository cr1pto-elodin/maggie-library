import { BadGatewayException } from '@nestjs/common';
import { PdfExtractionError } from '../exceptions/pdf-extraction.error.js';
import { DocumentIndexingService } from '../services/document-indexing/document-indexing.service.js';
import { DocumentsQueryService } from '../services/documents-query/documents-query.service.js';
import { DocumentsController } from './documents.controller.js';
import { OllamaEmbeddingService } from '../services/ollama-embedding/ollama-embedding.service.js';
import { PdfChunkingService } from '../services/pdf-chunking/pdf-chunking.service.js';
import { PdfExtractionService } from '../services/pdf-extraction/pdf-extraction.service.js';

describe('DocumentsController', () => {
  const extractionResult = {
    text: 'Conteúdo do PDF',
    totalPages: 1,
    pages: [],
    info: null,
    metadata: null,
    dates: {},
    fingerprints: [],
    permissions: null,
    outline: [],
  };
  const file = {
    buffer: Buffer.from('pdf'),
    mimetype: 'application/pdf',
    originalname: 'fixture.pdf',
    size: 3,
  };

  it('delegates document listing with raw pagination parameters', async () => {
    const response = {
      items: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
    };
    const queryService = {
      list: vi.fn().mockResolvedValue(response),
      findById: vi.fn(),
    };
    const controller = createController(
      { extract: vi.fn() },
      undefined,
      undefined,
      undefined,
      queryService,
    );

    await expect(controller.list('2', '10')).resolves.toBe(response);
    expect(queryService.list).toHaveBeenCalledWith('2', '10');
  });

  it('delegates document details by id', async () => {
    const response = { id: 'document-id', chunks: [] };
    const queryService = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(response),
    };
    const controller = createController(
      { extract: vi.fn() },
      undefined,
      undefined,
      undefined,
      queryService,
    );

    await expect(controller.findById('document-id')).resolves.toBe(response);
    expect(queryService.findById).toHaveBeenCalledWith('document-id');
  });

  it('indexes a PDF and returns the persisted document summary', async () => {
    const response = {
      documentId: 'document-id',
      status: 'indexed' as const,
      originalName: 'fixture.pdf',
      pageCount: 1,
      chunkCount: 1,
      embeddingModel: 'embeddinggemma',
      embeddingDimensions: 768,
    };
    const indexingService = { index: vi.fn().mockResolvedValue(response) };
    const controller = createController(
      { extract: vi.fn() },
      undefined,
      undefined,
      indexingService,
    );

    await expect(controller.index(file)).resolves.toEqual(response);
    expect(indexingService.index).toHaveBeenCalledWith(file);
  });

  it('extracts a PDF and returns the service result', async () => {
    const service = {
      extract: vi.fn().mockResolvedValue(extractionResult),
    };
    const controller = createController(service);
    await expect(controller.extract(file)).resolves.toEqual(extractionResult);
    expect(service.extract).toHaveBeenCalledWith(file.buffer);
  });

  it('propagates extraction errors to the exception filter', async () => {
    const extractionError = new PdfExtractionError();
    const service = {
      extract: vi.fn().mockRejectedValue(extractionError),
    };
    const controller = createController(service);

    await expect(controller.extract(file)).rejects.toBe(extractionError);
  });

  it('generates embeddings for the extracted PDF chunks', async () => {
    const chunks = [
      { index: 0, pageNumber: 1, text: 'Primeiro trecho' },
      { index: 1, pageNumber: 1, text: 'Segundo trecho' },
    ];
    const extractionService = {
      extract: vi.fn().mockResolvedValue(extractionResult),
    };
    const chunkingService = { chunk: vi.fn().mockReturnValue(chunks) };
    const embeddingService = {
      embed: vi.fn().mockResolvedValue({
        model: 'embeddinggemma',
        embeddings: [
          [0.1, 0.2],
          [0.3, 0.4],
        ],
      }),
    };
    const controller = createController(
      extractionService,
      chunkingService,
      embeddingService,
    );
    await expect(controller.embed(file)).resolves.toEqual({
      model: 'embeddinggemma',
      dimensions: 2,
      chunks: [
        { ...chunks[0], embedding: [0.1, 0.2] },
        { ...chunks[1], embedding: [0.3, 0.4] },
      ],
    });
    expect(embeddingService.embed).toHaveBeenCalledWith([
      'Primeiro trecho',
      'Segundo trecho',
    ]);
  });

  it('rejects a PDF without text before calling Ollama', async () => {
    const embeddingService = { embed: vi.fn() };
    const controller = createController(
      { extract: vi.fn().mockResolvedValue(extractionResult) },
      { chunk: vi.fn().mockReturnValue([]) },
      embeddingService,
    );
    await expect(controller.embed(file)).rejects.toThrow(
      'O PDF não possui texto para gerar embeddings.',
    );
    expect(embeddingService.embed).not.toHaveBeenCalled();
  });

  it('propagates extraction errors during embedding', async () => {
    const extractionError = new PdfExtractionError();
    const embeddingService = { embed: vi.fn() };
    const controller = createController(
      { extract: vi.fn().mockRejectedValue(extractionError) },
      { chunk: vi.fn() },
      embeddingService,
    );
    await expect(controller.embed(file)).rejects.toBe(extractionError);
    expect(embeddingService.embed).not.toHaveBeenCalled();
  });

  it('reports Ollama errors as a bad gateway', async () => {
    const controller = createController(
      { extract: vi.fn().mockResolvedValue(extractionResult) },
      {
        chunk: vi
          .fn()
          .mockReturnValue([{ index: 0, pageNumber: 1, text: 'Trecho' }]),
      },
      { embed: vi.fn().mockRejectedValue(new Error('Ollama unavailable')) },
    );
    await expect(controller.embed(file)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    await expect(controller.embed(file)).rejects.toThrow(
      'Não foi possível gerar embeddings usando o Ollama.',
    );
  });
});

function createController(
  extractionService: { extract: ReturnType<typeof vi.fn> },
  chunkingService: { chunk: ReturnType<typeof vi.fn> } = { chunk: vi.fn() },
  embeddingService: { embed: ReturnType<typeof vi.fn> } = { embed: vi.fn() },
  indexingService: { index: ReturnType<typeof vi.fn> } = { index: vi.fn() },
  queryService: {
    list: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  } = { list: vi.fn(), findById: vi.fn() },
) {
  return new DocumentsController(
    indexingService as unknown as DocumentIndexingService,
    queryService as unknown as DocumentsQueryService,
    extractionService as unknown as PdfExtractionService,
    chunkingService as unknown as PdfChunkingService,
    embeddingService as unknown as OllamaEmbeddingService,
  );
}
