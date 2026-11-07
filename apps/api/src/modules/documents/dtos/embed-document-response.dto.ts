import type { PdfChunk } from '../models/pdf-chunk.model.js';

export interface EmbeddedPdfChunk extends PdfChunk {
  embedding: number[];
}

export interface EmbedDocumentResponseDto {
  model: string;
  dimensions: number;
  chunks: EmbeddedPdfChunk[];
}
