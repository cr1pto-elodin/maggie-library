import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { IndexedDocument } from '../../models/indexed-document.model.js';
import { DocumentsRepository } from '../../repositories/documents.repository.js';
import { DocumentsQueryService } from './documents-query.service.js';

describe('DocumentsQueryService', () => {
  it('uses default pagination and calculates the total pages', async () => {
    const document = createDocument();
    const repository = {
      list: vi.fn().mockResolvedValue({ items: [document], total: 21 }),
      findById: vi.fn(),
    };
    const service = createService(repository);

    await expect(service.list()).resolves.toEqual({
      items: [document],
      pagination: { page: 1, limit: 20, total: 21, totalPages: 2 },
    });
    expect(repository.list).toHaveBeenCalledWith(0, 20);
  });

  it('converts page and limit into an offset', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      findById: vi.fn(),
    };
    const service = createService(repository);

    await expect(service.list('3', '10')).resolves.toMatchObject({
      items: [],
      pagination: { page: 3, limit: 10, total: 0, totalPages: 0 },
    });
    expect(repository.list).toHaveBeenCalledWith(20, 10);
  });

  it.each([
    ['page', '0', undefined],
    ['page', '1.5', undefined],
    ['page', 'abc', undefined],
    ['limit', undefined, '0'],
    ['limit', undefined, '101'],
  ])('rejects an invalid %s parameter', async (_parameter, page, limit) => {
    const service = createService({
      list: vi.fn(),
      findById: vi.fn(),
    });

    await expect(service.list(page, limit)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns document details', async () => {
    const document = { ...createDocument(), chunks: [] };
    const repository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(document),
    };
    const service = createService(repository);

    await expect(service.findById(document.id)).resolves.toBe(document);
  });

  it('returns not found when the document does not exist', async () => {
    const service = createService({
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
    });

    await expect(service.findById('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes an existing document', async () => {
    const repository = {
      list: vi.fn(),
      findById: vi.fn(),
      deleteById: vi.fn().mockResolvedValue(true),
    };
    const service = createService(repository);

    await expect(service.delete('document-id')).resolves.toBeUndefined();
    expect(repository.deleteById).toHaveBeenCalledWith('document-id');
  });

  it('returns not found when deleting an unknown document', async () => {
    const service = createService({
      list: vi.fn(),
      findById: vi.fn(),
      deleteById: vi.fn().mockResolvedValue(false),
    });

    await expect(service.delete('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

function createService(repository: {
  list: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  deleteById?: ReturnType<typeof vi.fn>;
}) {
  return new DocumentsQueryService(
    repository as unknown as DocumentsRepository,
  );
}

function createDocument(): IndexedDocument {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
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
    revision: 1,
    createdAt: new Date('2026-11-15T00:00:00Z'),
    updatedAt: new Date('2026-11-15T00:00:00Z'),
  };
}
