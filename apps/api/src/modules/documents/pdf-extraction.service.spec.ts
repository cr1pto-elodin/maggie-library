import { PdfExtractionService } from './pdf-extraction.service.js';

describe('PdfExtractionService', () => {
  const service = new PdfExtractionService();

  it('extracts text and metadata by page', async () => {
    const result = await service.extract(createPdfFixture());

    expect(result.totalPages).toBe(1);
    expect(result.text).toContain('Maggie Library PDF');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0]).toMatchObject({
      pageNumber: 1,
      text: expect.stringContaining('Maggie Library PDF'),
      width: 612,
      height: 792,
    });
    expect(result.info).toMatchObject({
      Title: 'Documento de teste',
      Author: 'Maggie Library',
    });
    expect(result.fingerprints).toHaveLength(2);
  });

  it('rejects an empty file', async () => {
    await expect(service.extract(Buffer.alloc(0))).rejects.toThrow(
      'O arquivo PDF não pode estar vazio.',
    );
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
