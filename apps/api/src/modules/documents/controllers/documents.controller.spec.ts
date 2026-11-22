import { PdfExtractionError } from '../exceptions/pdf-extraction.error.js';
import { DocumentIndexingService } from '../services/document-indexing/document-indexing.service.js';
import { DocumentsQueryService } from '../services/documents-query/documents-query.service.js';
import { DocumentsController } from './documents.controller.js';
import { PdfExtractionService } from '../services/pdf-extraction/pdf-extraction.service.js';
import { SemanticSearchService } from '../services/semantic-search/semantic-search.service.js';

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
      queryService,
    );

    await expect(controller.findById('document-id')).resolves.toBe(response);
    expect(queryService.findById).toHaveBeenCalledWith('document-id');
  });

  it('delegates document deletion by id', async () => {
    const queryService = {
      list: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const controller = createController(
      { extract: vi.fn() },
      undefined,
      queryService,
    );

    await expect(controller.delete('document-id')).resolves.toBeUndefined();
    expect(queryService.delete).toHaveBeenCalledWith('document-id');
  });

  it('delegates semantic search with its request body', async () => {
    const input = { query: 'Como funciona a biblioteca?', topK: 3 };
    const response = {
      model: 'embeddinggemma',
      topK: 3,
      minScore: 0.5,
      results: [],
    };
    const semanticSearchService = {
      search: vi.fn().mockResolvedValue(response),
    };
    const controller = createController(
      { extract: vi.fn() },
      undefined,
      undefined,
      semanticSearchService,
    );

    await expect(controller.search(input)).resolves.toBe(response);
    expect(semanticSearchService.search).toHaveBeenCalledWith(input);
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
    const controller = createController({ extract: vi.fn() }, indexingService);

    await expect(controller.index(file)).resolves.toEqual(response);
    expect(indexingService.index).toHaveBeenCalledWith(file);
  });

  it('reindexes a PDF under the existing document id', async () => {
    const response = {
      documentId: 'document-id',
      status: 'reindexed' as const,
      originalName: 'fixture.pdf',
      pageCount: 1,
      chunkCount: 1,
      embeddingModel: 'embeddinggemma',
      embeddingDimensions: 768,
      revision: 2,
    };
    const indexingService = {
      index: vi.fn(),
      reindex: vi.fn().mockResolvedValue(response),
    };
    const controller = createController({ extract: vi.fn() }, indexingService);

    await expect(controller.reindex('document-id', file)).resolves.toBe(
      response,
    );
    expect(indexingService.reindex).toHaveBeenCalledWith('document-id', file);
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
});

function createController(
  extractionService: { extract: ReturnType<typeof vi.fn> },
  indexingService: {
    index: ReturnType<typeof vi.fn>;
    reindex?: ReturnType<typeof vi.fn>;
  } = { index: vi.fn() },
  queryService: {
    list: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    delete?: ReturnType<typeof vi.fn>;
  } = { list: vi.fn(), findById: vi.fn() },
  semanticSearchService: { search: ReturnType<typeof vi.fn> } = {
    search: vi.fn(),
  },
) {
  return new DocumentsController(
    indexingService as unknown as DocumentIndexingService,
    queryService as unknown as DocumentsQueryService,
    extractionService as unknown as PdfExtractionService,
    semanticSearchService as unknown as SemanticSearchService,
  );
}
