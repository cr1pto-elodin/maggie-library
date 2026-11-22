import { registerAs, type ConfigType } from '@nestjs/config';
import {
  readNumberInRange,
  readPositiveInteger,
} from '../../../config/environment/environment-reader.js';

export const semanticSearchConfig = registerAs('semanticSearch', () => {
  const maxTopK = readPositiveInteger('SEMANTIC_SEARCH_MAX_TOP_K', 20);
  const defaultTopK = readPositiveInteger('SEMANTIC_SEARCH_TOP_K', 5);

  if (defaultTopK > maxTopK) {
    throw new Error(
      'SEMANTIC_SEARCH_TOP_K precisa ser menor ou igual a SEMANTIC_SEARCH_MAX_TOP_K.',
    );
  }

  return {
    defaultTopK,
    maxTopK,
    defaultMinScore: readNumberInRange('SEMANTIC_SEARCH_MIN_SCORE', 0.5, -1, 1),
  };
});

export type SemanticSearchConfig = ConfigType<typeof semanticSearchConfig>;
