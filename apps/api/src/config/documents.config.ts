import { registerAs, type ConfigType } from '@nestjs/config';
import {
  readNonNegativeInteger,
  readPositiveInteger,
} from './environment.validation.js';

export const documentsConfig = registerAs('documents', () => {
  const chunkSize = readPositiveInteger('DOCUMENT_CHUNK_SIZE', 1_200);
  const chunkOverlap = readNonNegativeInteger('DOCUMENT_CHUNK_OVERLAP', 200);

  if (chunkOverlap >= chunkSize) {
    throw new Error(
      'DOCUMENT_CHUNK_OVERLAP precisa ser menor que DOCUMENT_CHUNK_SIZE.',
    );
  }

  return {
    maxFileSizeBytes: readPositiveInteger(
      'DOCUMENT_MAX_FILE_SIZE_BYTES',
      10 * 1024 * 1024,
    ),
    chunkSize,
    chunkOverlap,
  };
});

export type DocumentsConfig = ConfigType<typeof documentsConfig>;
