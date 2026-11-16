import { BadRequestException } from '@nestjs/common';
import type { PdfUpload } from '../models/pdf-upload.model.js';
import { PdfUploadPipe } from './pdf-upload.pipe.js';

describe('PdfUploadPipe', () => {
  const pipe = new PdfUploadPipe();

  it('requires a file', async () => {
    await expect(pipe.transform(undefined)).rejects.toThrow(
      'Envie um arquivo PDF no campo "file".',
    );
  });

  it('accepts a PDF identified by its content', async () => {
    const file = createFile(Buffer.from('%PDF-1.4\n'));

    await expect(pipe.transform(file)).resolves.toBe(file);
  });

  it('rejects content that only declares the PDF mimetype', async () => {
    const file = createFile(Buffer.from('plain text'));

    await expect(pipe.transform(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(pipe.transform(file)).rejects.toThrow(
      'O arquivo precisa ser um PDF.',
    );
  });
});

function createFile(buffer: Buffer): PdfUpload {
  return {
    buffer,
    mimetype: 'application/pdf',
    originalname: 'fixture.pdf',
    size: buffer.length,
  };
}
