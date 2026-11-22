import type { SemanticSearchResult } from '../models/semantic-search.model.js';

export interface SemanticSearchResponseDto {
  model: string;
  topK: number;
  minScore: number;
  results: SemanticSearchResult[];
}
