import type { IndexedDocument } from './indexed-document.model.js';

export type DocumentSummary = Omit<IndexedDocument, 'checksumSha256'>;

export interface DocumentChunkDetails {
  id: string;
  index: number;
  pageNumber: number;
  content: string;
  createdAt: Date;
}

export interface DocumentDetails extends IndexedDocument {
  chunks: DocumentChunkDetails[];
}

export interface DocumentPage {
  items: DocumentSummary[];
  total: number;
}
