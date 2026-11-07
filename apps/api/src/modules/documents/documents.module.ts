import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { PdfExtractionService } from './pdf-extraction.service.js';

@Module({
  controllers: [DocumentsController],
  providers: [PdfExtractionService],
  exports: [PdfExtractionService],
})
export class DocumentsModule {}
