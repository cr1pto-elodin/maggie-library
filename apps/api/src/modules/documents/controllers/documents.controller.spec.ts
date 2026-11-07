import { BadRequestException } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { OllamaEmbeddingService } from '../services/ollama-embedding.service.js';
import { PdfChunkingService } from '../services/pdf-chunking.service.js';
import { PdfExtractionService } from '../services/pdf-extraction.service.js';

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

  it('extracts a PDF and returns the service result', async () => {
    const service = {
      extract: vi.fn().mockResolvedValue(extractionResult),
    };
    const controller = createController(service);
    const file = { buffer: Buffer.from('pdf'), mimetype: 'application/pdf' };

    await expect(controller.extract(file)).resolves.toEqual(extractionResult);
    expect(service.extract).toHaveBeenCalledWith(file.buffer);
  });

  it('rejects a missing file', async () => {
    const controller = createController({ extract: vi.fn() });

    await expect(controller.extract()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a non-PDF file', async () => {
    const controller = createController({ extract: vi.fn() });
    const file = { buffer: Buffer.from('text'), mimetype: 'text/plain' };

    await expect(controller.extract(file)).rejects.toThrow(
      'O arquivo precisa ser um PDF.',
    );
  });

  it('translates extraction errors to a bad request', async () => {
    const service = {
      extract: vi.fn().mockRejectedValue(new Error('invalid PDF')),
    };
    const controller = createController(service);
    const file = { buffer: Buffer.from('pdf'), mimetype: 'application/pdf' };

    await expect(controller.extract(file)).rejects.toThrow(
      'Não foi possível extrair o conteúdo do arquivo PDF.',
    );
  });
});

function createController(service: { extract: ReturnType<typeof vi.fn> }) {
  return new DocumentsController(
    service as unknown as PdfExtractionService,
    {} as PdfChunkingService,
    {} as OllamaEmbeddingService,
  );
}
