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
  revision: number;
  createdAt: Date;
  updatedAt: Date;
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

export interface ReindexDocumentInput extends PersistDocumentInput {
  documentId: string;
  expectedRevision: number;
}
