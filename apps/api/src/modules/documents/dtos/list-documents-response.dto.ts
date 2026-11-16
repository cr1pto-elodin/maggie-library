import type { DocumentSummary } from '../models/document-query.model.js';

export interface ListDocumentsResponseDto {
  items: DocumentSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
