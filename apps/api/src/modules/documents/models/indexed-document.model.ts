import type { PdfChunk } from './pdf-chunk.model.js';

export interface IndexedDocument {
  id: string;
  checksumSha256: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number;
  embeddingModel: string;
  embeddingDimensions: number;
  chunkSize: number;
  chunkOverlap: number;
  chunkCount: number;
  createdAt: Date;
}

export interface PersistDocumentInput {
  checksumSha256: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number;
  embeddingModel: string;
  embeddingDimensions: number;
  chunkSize: number;
  chunkOverlap: number;
  chunks: Array<PdfChunk & { embedding: number[] }>;
}

export interface PersistDocumentResult {
  document: IndexedDocument;
  created: boolean;
}
