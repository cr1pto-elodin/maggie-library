import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import {
  documentsConfig,
  type DocumentsConfig,
} from './config/documents.config.js';
import { ollamaConfig } from './config/ollama.config.js';
import { DocumentsController } from './controllers/documents.controller.js';
import { DocumentsRepository } from './repositories/documents.repository.js';
import { DocumentIndexingService } from './services/document-indexing/document-indexing.service.js';
import { OllamaEmbeddingService } from './services/ollama-embedding/ollama-embedding.service.js';
import { PdfChunkingService } from './services/pdf-chunking/pdf-chunking.service.js';
import { PdfExtractionService } from './services/pdf-extraction/pdf-extraction.service.js';

@Module({
  imports: [
    ConfigModule.forFeature(documentsConfig),
    ConfigModule.forFeature(ollamaConfig),
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
    DocumentsRepository,
    OllamaEmbeddingService,
    PdfChunkingService,
    PdfExtractionService,
  ],
  exports: [OllamaEmbeddingService, PdfExtractionService],
})
export class DocumentsModule {}
