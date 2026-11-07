import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { OllamaEmbeddingService } from './ollama-embedding.service.js';
import { PdfChunkingService } from './pdf-chunking.service.js';
import { PdfExtractionService } from './pdf-extraction.service.js';

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
