import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';
import { appConfig, type AppConfig } from './../src/config/app.config.js';
import {
  documentsConfig,
  type DocumentsConfig,
} from './../src/modules/documents/config/documents.config.js';
import { DocumentIndexingService } from './../src/modules/documents/services/document-indexing/document-indexing.service.js';
import { DocumentsQueryService } from './../src/modules/documents/services/documents-query/documents-query.service.js';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;
  let apiPrefix: string;
  let maxFileSizeBytes: number;
  const indexingService = {
    index: vi.fn().mockResolvedValue({
      documentId: 'document-id',
      status: 'indexed',
      originalName: 'fixture.pdf',
      pageCount: 1,
      chunkCount: 1,
      embeddingModel: 'embeddinggemma',
      embeddingDimensions: 768,
    }),
  };
  const documentId = '550e8400-e29b-41d4-a716-446655440000';
  const documentSummary = {
    id: documentId,
    originalName: 'fixture.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
    pageCount: 1,
    embeddingModel: 'embeddinggemma',
    embeddingDimensions: 768,
    chunkSize: 1_200,
    chunkOverlap: 200,
    chunkCount: 1,
    createdAt: new Date('2026-11-15T00:00:00Z'),
  };
  const indexedDocument = {
    ...documentSummary,
    checksumSha256: 'a'.repeat(64),
  };
  const queryService = {
    list: vi.fn().mockResolvedValue({
      items: [documentSummary],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
    findById: vi.fn().mockResolvedValue({
      ...indexedDocument,
      chunks: [
        {
          id: '650e8400-e29b-41d4-a716-446655440000',
          index: 0,
          pageNumber: 1,
          content: 'Maggie Library PDF',
          createdAt: new Date('2026-11-15T00:00:00Z'),
        },
      ],
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DocumentIndexingService)
      .useValue(indexingService)
      .overrideProvider(DocumentsQueryService)
      .useValue(queryService)
      .compile();

    app = moduleFixture.createNestApplication();
    const applicationConfig = app.get<AppConfig>(appConfig.KEY);
    const documentConfig = app.get<DocumentsConfig>(documentsConfig.KEY);

    setupApp(app, applicationConfig);
    apiPrefix = applicationConfig.apiPrefix;
    maxFileSizeBytes = documentConfig.maxFileSizeBytes;
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get(`/${apiPrefix}/health`)
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/documents/extract (POST)', async () => {
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/documents/extract`)
      .attach('file', createPdfFixture(), {
        filename: 'fixture.pdf',
        contentType: 'application/pdf',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.totalPages).toBe(1);
        expect(body.text).toContain('Maggie Library PDF');
      });
  });

  it('/api/documents/index (POST)', async () => {
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/documents/index`)
      .attach('file', createPdfFixture(), {
        filename: 'fixture.pdf',
        contentType: 'application/pdf',
      })
      .expect(201)
      .expect({
        documentId: 'document-id',
        status: 'indexed',
        originalName: 'fixture.pdf',
        pageCount: 1,
        chunkCount: 1,
        embeddingModel: 'embeddinggemma',
        embeddingDimensions: 768,
      });

    expect(indexingService.index).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: 'fixture.pdf',
        mimetype: 'application/pdf',
      }),
    );
  });

  it('/api/documents (GET)', async () => {
    await request(app.getHttpServer())
      .get(`/${apiPrefix}/documents?page=1&limit=20`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toHaveLength(1);
        expect(body.items[0]).not.toHaveProperty('embedding');
        expect(body.pagination).toEqual({
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        });
      });

    expect(queryService.list).toHaveBeenCalledWith('1', '20');
  });

  it('/api/documents/:id (GET)', async () => {
    await request(app.getHttpServer())
      .get(`/${apiPrefix}/documents/${documentId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(documentId);
        expect(body.chunks).toHaveLength(1);
        expect(body.chunks[0]).not.toHaveProperty('embedding');
      });
  });

  it('/api/documents/:id (GET) rejects an invalid UUID', () => {
    return request(app.getHttpServer())
      .get(`/${apiPrefix}/documents/not-a-uuid`)
      .expect(400);
  });

  it('/api/documents/:id (GET) returns not found', async () => {
    queryService.findById.mockRejectedValueOnce(
      new NotFoundException('Documento não encontrado.'),
    );

    await request(app.getHttpServer())
      .get(`/${apiPrefix}/documents/650e8400-e29b-41d4-a716-446655440000`)
      .expect(404);
  });

  it('/api/documents/extract (POST) rejects oversized PDFs', async () => {
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/documents/extract`)
      .attach('file', Buffer.alloc(maxFileSizeBytes + 1), {
        filename: 'oversized.pdf',
        contentType: 'application/pdf',
      })
      .expect(413);
  });

  afterEach(async () => {
    indexingService.index.mockClear();
    queryService.list.mockClear();
    queryService.findById.mockClear();
    await app.close();
  });
});

function createPdfFixture(): Buffer {
  const content = 'BT /F1 18 Tf 72 720 Td (Maggie Library PDF) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Title (Documento de teste) /Author (Maggie Library) >>',
  ];
  const chunks = ['%PDF-1.4\n'];
  const offsets = [0];
  let length = Buffer.byteLength(chunks[0]);

  objects.forEach((object, index) => {
    offsets.push(length);
    const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`;
    chunks.push(chunk);
    length += Buffer.byteLength(chunk);
  });

  const xrefOffset = length;
  const xrefEntries = offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, '0')} 00000 n `)
    .join('\n');

  chunks.push(
    `xref\n0 7\n0000000000 65535 f \n${xrefEntries}\ntrailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );

  return Buffer.from(chunks.join(''));
}
