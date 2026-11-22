import type { Database } from '../../../database/database.types.js';
import { documentChunks, documents } from '../../../database/schema.js';
import type {
  IndexedDocument,
  PersistDocumentInput,
} from '../models/indexed-document.model.js';
import { DocumentsRepository } from './documents.repository.js';

describe('DocumentsRepository', () => {
  it('finds a document and its chunk count by checksum', async () => {
    const indexedDocument = createIndexedDocument();
    const select = vi
      .fn()
      .mockReturnValue(createSelectChain([indexedDocument]));
    const repository = new DocumentsRepository({
      select,
    } as unknown as Database);

    await expect(repository.findByChecksum('a'.repeat(64))).resolves.toEqual(
      indexedDocument,
    );
    expect(select).toHaveBeenCalledOnce();
  });

  it('returns null when the checksum is unknown', async () => {
    const select = vi.fn().mockReturnValue(createSelectChain([]));
    const repository = new DocumentsRepository({
      select,
    } as unknown as Database);

    await expect(repository.findByChecksum('b'.repeat(64))).resolves.toBeNull();
  });

  it('lists documents with pagination, ordering, and total count', async () => {
    const { checksumSha256: _checksumSha256, ...documentSummary } =
      createIndexedDocument();
    const listChain = createListChain([documentSummary]);
    const totalFrom = vi.fn().mockResolvedValue([{ total: 1 }]);
    const select = vi
      .fn()
      .mockReturnValueOnce(listChain)
      .mockReturnValueOnce({ from: totalFrom });
    const repository = new DocumentsRepository({
      select,
    } as unknown as Database);

    await expect(repository.list(20, 10)).resolves.toEqual({
      items: [documentSummary],
      total: 1,
    });
    expect(documentSummary).not.toHaveProperty('checksumSha256');
    expect(listChain.limit).toHaveBeenCalledWith(10);
    expect(listChain.offset).toHaveBeenCalledWith(20);
    expect(listChain.orderBy).toHaveBeenCalledOnce();
  });

  it('returns document details with ordered chunks and no embeddings', async () => {
    const indexedDocument = createIndexedDocument();
    const chunks = [
      {
        id: 'chunk-id',
        index: 0,
        pageNumber: 1,
        content: 'Trecho',
        createdAt: new Date('2026-11-15T00:00:00Z'),
      },
    ];
    const select = vi
      .fn()
      .mockReturnValueOnce(createSelectChain([indexedDocument]))
      .mockReturnValueOnce(createChunksChain(chunks));
    const repository = new DocumentsRepository({
      select,
    } as unknown as Database);

    await expect(repository.findById(indexedDocument.id)).resolves.toEqual({
      ...indexedDocument,
      chunks,
    });
    expect(chunks[0]).not.toHaveProperty('embedding');
  });

  it('does not query chunks when the document does not exist', async () => {
    const select = vi.fn().mockReturnValue(createSelectChain([]));
    const repository = new DocumentsRepository({
      select,
    } as unknown as Database);

    await expect(repository.findById('missing-id')).resolves.toBeNull();
    expect(select).toHaveBeenCalledOnce();
  });

  it('searches compatible chunks by cosine similarity without exposing embeddings', async () => {
    const results = [
      {
        chunkId: 'chunk-id',
        documentId: 'document-id',
        documentName: 'library.pdf',
        chunkIndex: 0,
        pageNumber: 1,
        content: 'Trecho relevante',
        score: 0.82,
      },
    ];
    const searchChain = createSearchChain(results);
    const select = vi.fn().mockReturnValue(searchChain);
    const repository = new DocumentsRepository({
      select,
    } as unknown as Database);

    await expect(
      repository.search({
        embedding: [0.1, 0.2],
        embeddingModel: 'embeddinggemma',
        embeddingDimensions: 768,
        topK: 5,
        minScore: 0.5,
        documentIds: ['550e8400-e29b-41d4-a716-446655440000'],
      }),
    ).resolves.toEqual(results);

    expect(select).toHaveBeenCalledWith(
      expect.not.objectContaining({ embedding: expect.anything() }),
    );
    expect(searchChain.innerJoin).toHaveBeenCalledOnce();
    expect(searchChain.where).toHaveBeenCalledOnce();
    expect(searchChain.orderBy).toHaveBeenCalledOnce();
    expect(searchChain.limit).toHaveBeenCalledWith(5);
  });

  it('inserts the document and all chunks in the same transaction', async () => {
    const insertedDocument = createIndexedDocument();
    const documentValues = vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([insertedDocument]),
      }),
    });
    const chunkValues = vi.fn().mockResolvedValue(undefined);
    const transaction = {
      insert: vi.fn((table) =>
        table === documents
          ? { values: documentValues }
          : { values: chunkValues },
      ),
    };
    const database = {
      transaction: vi.fn((callback) => callback(transaction)),
    };
    const repository = new DocumentsRepository(database as unknown as Database);
    const input = createInput();

    await expect(repository.createIfAbsent(input)).resolves.toEqual({
      created: true,
      document: { ...insertedDocument, chunkCount: input.chunks.length },
    });
    expect(database.transaction).toHaveBeenCalledOnce();
    expect(transaction.insert).toHaveBeenNthCalledWith(1, documents);
    expect(transaction.insert).toHaveBeenNthCalledWith(2, documentChunks);
    expect(chunkValues).toHaveBeenCalledWith([
      {
        documentId: insertedDocument.id,
        chunkIndex: 0,
        pageNumber: 1,
        content: 'Primeiro trecho',
        embedding: [0.1, 0.2],
      },
      {
        documentId: insertedDocument.id,
        chunkIndex: 1,
        pageNumber: 2,
        content: 'Segundo trecho',
        embedding: [0.3, 0.4],
      },
    ]);
  });

  it('returns the winner when a concurrent insert uses the same checksum', async () => {
    const existingDocument = createIndexedDocument();
    const documentValues = vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });
    const transaction = {
      insert: vi.fn().mockReturnValue({ values: documentValues }),
      select: vi.fn().mockReturnValue(createSelectChain([existingDocument])),
    };
    const database = {
      transaction: vi.fn((callback) => callback(transaction)),
    };
    const repository = new DocumentsRepository(database as unknown as Database);

    await expect(repository.createIfAbsent(createInput())).resolves.toEqual({
      created: false,
      document: existingDocument,
    });
    expect(transaction.insert).toHaveBeenCalledOnce();
  });

  it('propagates chunk insertion failures so the transaction can roll back', async () => {
    const insertedDocument = createIndexedDocument();
    const transaction = {
      insert: vi.fn((table) =>
        table === documents
          ? {
              values: vi.fn().mockReturnValue({
                onConflictDoNothing: vi.fn().mockReturnValue({
                  returning: vi.fn().mockResolvedValue([insertedDocument]),
                }),
              }),
            }
          : {
              values: vi
                .fn()
                .mockRejectedValue(new Error('chunk insertion failed')),
            },
      ),
    };
    const database = {
      transaction: vi.fn((callback) => callback(transaction)),
    };
    const repository = new DocumentsRepository(database as unknown as Database);

    await expect(repository.createIfAbsent(createInput())).rejects.toThrow(
      'chunk insertion failed',
    );
  });
});

function createSelectChain(result: IndexedDocument[]) {
  const chain = {
    from: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn(),
    groupBy: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
  };
  chain.from.mockReturnValue(chain);
  chain.leftJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.groupBy.mockReturnValue(chain);

  return chain;
}

function createListChain(
  result: Array<Omit<IndexedDocument, 'checksumSha256'>>,
) {
  const chain = {
    from: vi.fn(),
    leftJoin: vi.fn(),
    groupBy: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn().mockResolvedValue(result),
  };
  chain.from.mockReturnValue(chain);
  chain.leftJoin.mockReturnValue(chain);
  chain.groupBy.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);

  return chain;
}

function createChunksChain(
  result: Array<{
    id: string;
    index: number;
    pageNumber: number;
    content: string;
    createdAt: Date;
  }>,
) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn().mockResolvedValue(result),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);

  return chain;
}

function createSearchChain(
  result: Array<{
    chunkId: string;
    documentId: string;
    documentName: string;
    chunkIndex: number;
    pageNumber: number;
    content: string;
    score: number;
  }>,
) {
  const chain = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
  };
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);

  return chain;
}

function createIndexedDocument(): IndexedDocument {
  return {
    id: 'document-id',
    checksumSha256: 'a'.repeat(64),
    originalName: 'library.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 10,
    pageCount: 2,
    embeddingModel: 'embeddinggemma',
    embeddingDimensions: 768,
    chunkSize: 1_200,
    chunkOverlap: 200,
    chunkCount: 2,
    createdAt: new Date('2026-11-15T00:00:00Z'),
  };
}

function createInput(): PersistDocumentInput {
  return {
    checksumSha256: 'a'.repeat(64),
    originalName: 'library.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 10,
    pageCount: 2,
    embeddingModel: 'embeddinggemma',
    embeddingDimensions: 768,
    chunkSize: 1_200,
    chunkOverlap: 200,
    chunks: [
      {
        index: 0,
        pageNumber: 1,
        text: 'Primeiro trecho',
        embedding: [0.1, 0.2],
      },
      {
        index: 1,
        pageNumber: 2,
        text: 'Segundo trecho',
        embedding: [0.3, 0.4],
      },
    ],
  };
}
