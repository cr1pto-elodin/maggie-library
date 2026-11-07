import { Module } from '@nestjs/common';
import { DocumentsController } from './controllers/documents.controller.js';
import { OllamaEmbeddingService } from './services/ollama-embedding.service.js';
import { PdfChunkingService } from './services/pdf-chunking.service.js';
import { PdfExtractionService } from './services/pdf-extraction.service.js';

@Module({
  controllers: [DocumentsController],
  providers: [
    OllamaEmbeddingService,
    PdfChunkingService,
    PdfExtractionService,
  ],
  exports: [OllamaEmbeddingService, PdfExtractionService],
})
export class DocumentsModule {}
