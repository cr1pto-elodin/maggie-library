export interface SemanticSearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  score: number;
}

export interface SemanticSearchCriteria {
  embedding: number[];
  embeddingModel: string;
  embeddingDimensions: number;
  topK: number;
  minScore: number;
  documentIds?: string[];
}
