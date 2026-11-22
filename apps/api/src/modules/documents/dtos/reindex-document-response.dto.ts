export interface ReindexDocumentResponseDto {
  documentId: string;
  status: 'reindexed';
  originalName: string;
  pageCount: number;
  chunkCount: number;
  embeddingModel: string;
  embeddingDimensions: number;
  revision: number;
}
