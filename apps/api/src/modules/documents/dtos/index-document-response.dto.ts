export interface IndexDocumentResponseDto {
  documentId: string;
  status: 'indexed' | 'already_indexed';
  originalName: string;
  pageCount: number;
  chunkCount: number;
  embeddingModel: string;
  embeddingDimensions: number;
}
