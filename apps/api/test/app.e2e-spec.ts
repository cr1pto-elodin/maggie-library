import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/documents/extract (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/documents/extract')
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

  afterEach(async () => {
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
