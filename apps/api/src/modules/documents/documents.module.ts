import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import {
  documentsConfig,
  type DocumentsConfig,
} from './config/documents.config.js';
import { ollamaConfig } from './config/ollama.config.js';
import { semanticSearchConfig } from './config/semantic-search.config.js';
import { DocumentsController } from './controllers/documents.controller.js';
import { PdfExtractionExceptionFilter } from './filters/pdf-extraction-exception.filter.js';
import { PdfUploadPipe } from './pipes/pdf-upload.pipe.js';
import { DocumentsRepository } from './repositories/documents.repository.js';
import { DocumentIndexingService } from './services/document-indexing/document-indexing.service.js';
import { DocumentsQueryService } from './services/documents-query/documents-query.service.js';
import { OllamaEmbeddingService } from './services/ollama-embedding/ollama-embedding.service.js';
import { PdfChunkingService } from './services/pdf-chunking/pdf-chunking.service.js';
import { PdfExtractionService } from './services/pdf-extraction/pdf-extraction.service.js';
import { SemanticSearchService } from './services/semantic-search/semantic-search.service.js';

@Module({
  imports: [
    ConfigModule.forFeature(documentsConfig),
    ConfigModule.forFeature(ollamaConfig),
    ConfigModule.forFeature(semanticSearchConfig),
    MulterModule.registerAsync({
      imports: [ConfigModule.forFeature(documentsConfig)],
      inject: [documentsConfig.KEY],
      useFactory: (config: DocumentsConfig) => ({
        limits: {
          fileSize: config.maxFileSizeBytes,
        },
      }),
    }),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentIndexingService,
    DocumentsQueryService,
    DocumentsRepository,
    OllamaEmbeddingService,
    PdfExtractionExceptionFilter,
    PdfChunkingService,
    PdfExtractionService,
    PdfUploadPipe,
    SemanticSearchService,
  ],
  exports: [OllamaEmbeddingService, PdfExtractionService],
})
export class DocumentsModule {}
