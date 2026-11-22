export interface SemanticSearchRequestDto {
  query: string;
  topK?: number;
  minScore?: number;
  documentIds?: string[];
}
