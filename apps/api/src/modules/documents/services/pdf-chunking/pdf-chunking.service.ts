import { Inject, Injectable } from '@nestjs/common';
import {
  documentsConfig,
  type DocumentsConfig,
} from '../../../../config/documents.config.js';
import type { PdfChunk } from '../../models/pdf-chunk.model.js';
import type { PdfExtractionResult } from '../../models/pdf-extraction.model.js';

@Injectable()
export class PdfChunkingService {
  constructor(
    @Inject(documentsConfig.KEY)
    private readonly config: DocumentsConfig,
  ) {}

  chunk(document: PdfExtractionResult): PdfChunk[] {
    const chunks: PdfChunk[] = [];

    for (const page of document.pages) {
      const text = page.text.replace(/\s+/g, ' ').trim();

      for (let start = 0; start < text.length;) {
        const end = Math.min(start + this.config.chunkSize, text.length);
        const chunkText = text.slice(start, end).trim();

        if (chunkText) {
          chunks.push({
            index: chunks.length,
            pageNumber: page.pageNumber,
            text: chunkText,
          });
        }

        if (end === text.length) {
          break;
        }

        start = end - this.config.chunkOverlap;
      }
    }

    return chunks;
  }
}
