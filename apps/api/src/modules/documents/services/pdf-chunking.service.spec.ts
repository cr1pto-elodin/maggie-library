import type { PdfExtractionResult } from '../models/pdf-extraction.model.js';
import { PdfChunkingService } from './pdf-chunking.service.js';

describe('PdfChunkingService', () => {
  const service = new PdfChunkingService();

  it('normalizes whitespace and ignores empty pages', () => {
    const document = createDocument([
      '  Maggie\n\nLibrary\torganiza   conhecimento.  ',
      '   ',
    ]);

    expect(service.chunk(document)).toEqual([
      {
        index: 0,
        pageNumber: 1,
        text: 'Maggie Library organiza conhecimento.',
      },
    ]);
  });

  it('creates overlapping chunks for long pages', () => {
    const text = 'a'.repeat(1_300);

    const chunks = service.chunk(createDocument([text]));

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.text).toBe(text.slice(0, 1_200));
    expect(chunks[1]?.text).toBe(text.slice(1_000));
    expect(chunks[0]?.text.slice(-200)).toBe(chunks[1]?.text.slice(0, 200));
  });

  it('keeps page numbers and sequential indexes across pages', () => {
    const chunks = service.chunk(
      createDocument(['Primeira página.', 'Segunda página.']),
    );

    expect(chunks).toEqual([
      { index: 0, pageNumber: 1, text: 'Primeira página.' },
      { index: 1, pageNumber: 2, text: 'Segunda página.' },
    ]);
  });
});

function createDocument(pageTexts: string[]): PdfExtractionResult {
  return {
    text: pageTexts.join('\n'),
    totalPages: pageTexts.length,
    pages: pageTexts.map((text, index) => ({
      pageNumber: index + 1,
      pageLabel: null,
      text,
      width: null,
      height: null,
      links: [],
    })),
    info: null,
    metadata: null,
    dates: {},
    fingerprints: [],
    permissions: null,
    outline: [],
  };
}
