import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigurationModule } from '../../config/configuration.module.js';
import {
  documentsConfig,
  type DocumentsConfig,
} from '../../config/documents.config.js';
import { DocumentsController } from './controllers/documents.controller.js';
import { OllamaEmbeddingService } from './services/ollama-embedding/ollama-embedding.service.js';
import { PdfChunkingService } from './services/pdf-chunking/pdf-chunking.service.js';
import { PdfExtractionService } from './services/pdf-extraction/pdf-extraction.service.js';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigurationModule],
      inject: [documentsConfig.KEY],
      useFactory: (config: DocumentsConfig) => ({
        limits: {
          fileSize: config.maxFileSizeBytes,
        },
      }),
    }),
  ],
  controllers: [DocumentsController],
  providers: [OllamaEmbeddingService, PdfChunkingService, PdfExtractionService],
  exports: [OllamaEmbeddingService, PdfExtractionService],
})
export class DocumentsModule {}
