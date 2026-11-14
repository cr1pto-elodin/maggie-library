import { registerAs, type ConfigType } from '@nestjs/config';
import {
  readHttpUrl,
  readNonEmptyString,
} from '../../../config/environment/environment-reader.js';

export const ollamaConfig = registerAs('ollama', () => ({
  baseUrl: readHttpUrl('OLLAMA_URL', 'http://localhost:11434'),
  chatModel: readNonEmptyString('OLLAMA_MODEL', 'llama3.2:3b'),
  embeddingModel: readNonEmptyString(
    'OLLAMA_EMBEDDING_MODEL',
    'embeddinggemma',
  ),
  embeddingPath: '/api/embed',
}));

export type OllamaConfig = ConfigType<typeof ollamaConfig>;
