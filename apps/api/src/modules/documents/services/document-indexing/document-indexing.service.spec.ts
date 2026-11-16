import { createHash } from 'node:crypto';
import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { EMBEDDING_DIMENSIONS } from '../../../../database/database.constants.js';
import type { DocumentsConfig } from '../../config/documents.config.js';
import { PdfExtractionError } from '../../exceptions/pdf-extraction.error.js';
import type { IndexedDocument } from '../../models/indexed-document.model.js';
import type { PdfUpload } from '../../models/pdf-upload.model.js';
import { DocumentsRepository } from '../../repositories/documents.repository.js';
import { OllamaEmbeddingService } from '../ollama-embedding/ollama-embedding.service.js';
import { PdfChunkingService } from '../pdf-chunking/pdf-chunking.service.js';
import { PdfExtractionService } from '../pdf-extraction/pdf-extraction.service.js';
import { DocumentIndexingService } from './document-indexing.service.js';

describe('DocumentIndexingService', () => {
  const config: DocumentsConfig = {
    maxFileSizeBytes: 10 * 1024 * 1024,
    chunkSize: 1_200,
    chunkOverlap: 200,
  };
  const file: PdfUpload = {
    buffer: Buffer.from('pdf'),
    mimetype: 'application/pdf',
    originalname: 'library.pdf',
    size: 3,
  };
  const extractionResult = {
    text: 'Conteúdo',
    totalPages: 1,
    pages: [],
    info: null,
    metadata: null,
    dates: {},
    fingerprints: [],
    permissions: null,
    outline: [],
  };
  const chunks = [{ index: 0, pageNumber: 1, text: 'Conteúdo' }];
  const embeddings = [Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0.1)];

  it('persists a new document and returns a summary without vectors', async () => {
    const repository = {
      findByChecksum: vi.fn().mockResolvedValue(null),
      createIfAbsent: vi.fn().mockImplementation(async (input) => ({
        created: true,
        document: createIndexedDocument({
          checksumSha256: input.checksumSha256,
          originalName: input.originalName,
          chunkCount: input.chunks.length,
        }),
      })),
    };
    const service = createService(repository);

    await expect(service.index(file)).resolves.toEqual({
      documentId: 'document-id',
      status: 'indexed',
      originalName: 'library.pdf',
      pageCount: 1,
      chunkCount: 1,
      embeddingModel: 'embeddinggemma',
      embeddingDimensions: EMBEDDING_DIMENSIONS,
    });
    expect(repository.findByChecksum).toHaveBeenCalledWith(
      createHash('sha256').update(file.buffer).digest('hex'),
    );
    expect(repository.createIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        pageCount: 1,
        embeddingModel: 'embeddinggemma',
        embeddingDimensions: EMBEDDING_DIMENSIONS,
        chunkSize: config.chunkSize,
        chunkOverlap: config.chunkOverlap,
        chunks: [{ ...chunks[0], embedding: embeddings[0] }],
      }),
    );
  });

  it('returns an existing document without repeating the pipeline', async () => {
    const repository = {
      findByChecksum: vi.fn().mockResolvedValue(createIndexedDocument()),
      createIfAbsent: vi.fn(),
    };
    const extractionService = { extract: vi.fn() };
    const chunkingService = { chunk: vi.fn() };
    const embeddingService = { embed: vi.fn() };
    const service = createService(
      repository,
      extractionService,
      chunkingService,
      embeddingService,
    );

    await expect(service.index(file)).resolves.toMatchObject({
      documentId: 'document-id',
      status: 'already_indexed',
    });
    expect(extractionService.extract).not.toHaveBeenCalled();
    expect(chunkingService.chunk).not.toHaveBeenCalled();
    expect(embeddingService.embed).not.toHaveBeenCalled();
    expect(repository.createIfAbsent).not.toHaveBeenCalled();
  });

  it('reports a concurrent insertion as already indexed', async () => {
    const repository = {
      findByChecksum: vi.fn().mockResolvedValue(null),
      createIfAbsent: vi.fn().mockResolvedValue({
        created: false,
        document: createIndexedDocument(),
      }),
    };
    const service = createService(repository);

    await expect(service.index(file)).resolves.toMatchObject({
      documentId: 'document-id',
      status: 'already_indexed',
    });
  });

  it('rejects a PDF without text before generating embeddings', async () => {
    const embeddingService = { embed: vi.fn() };
    const service = createService(
      createRepository(),
      undefined,
      { chunk: vi.fn().mockReturnValue([]) },
      embeddingService,
    );

    await expect(service.index(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(embeddingService.embed).not.toHaveBeenCalled();
  });

  it('propagates extraction failures and translates embedding failures', async () => {
    const extractionError = new PdfExtractionError();
    const extractionFailure = createService(createRepository(), {
      extract: vi.fn().mockRejectedValue(extractionError),
    });
    const embeddingFailure = createService(
      createRepository(),
      undefined,
      undefined,
      { embed: vi.fn().mockRejectedValue(new Error('Ollama unavailable')) },
    );

    await expect(extractionFailure.index(file)).rejects.toBe(extractionError);
    await expect(embeddingFailure.index(file)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('rejects embeddings incompatible with the database vector', async () => {
    const service = createService(createRepository(), undefined, undefined, {
      embed: vi.fn().mockResolvedValue({
        model: 'other-model',
        embeddings: [[0.1, 0.2]],
      }),
    });

    await expect(service.index(file)).rejects.toThrow(
      `O modelo de embeddings precisa retornar ${EMBEDDING_DIMENSIONS} dimensões.`,
    );
  });

  function createService(
    repository = createRepository(),
    extractionService = {
      extract: vi.fn().mockResolvedValue(extractionResult),
    },
    chunkingService = { chunk: vi.fn().mockReturnValue(chunks) },
    embeddingService = {
      embed: vi.fn().mockResolvedValue({
        model: 'embeddinggemma',
        embeddings,
      }),
    },
  ) {
    return new DocumentIndexingService(
      repository as unknown as DocumentsRepository,
      extractionService as unknown as PdfExtractionService,
      chunkingService as unknown as PdfChunkingService,
      embeddingService as unknown as OllamaEmbeddingService,
      config,
    );
  }

  function createRepository() {
    return {
      findByChecksum: vi.fn().mockResolvedValue(null),
      createIfAbsent: vi.fn(),
    };
  }

  function createIndexedDocument(
    overrides: Partial<IndexedDocument> = {},
  ): IndexedDocument {
    return {
      id: 'document-id',
      checksumSha256: 'a'.repeat(64),
      originalName: 'library.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 3,
      pageCount: 1,
      embeddingModel: 'embeddinggemma',
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      chunkCount: 1,
      createdAt: new Date('2026-11-15T00:00:00Z'),
      ...overrides,
    };
  }
});
