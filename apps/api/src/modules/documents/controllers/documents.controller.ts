import {
  BadGatewayException,
  BadRequestException,
  Controller,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { EmbedDocumentResponseDto } from '../dtos/embed-document-response.dto.js';
import type { PdfUpload } from '../models/pdf-upload.model.js';
import { OllamaEmbeddingService } from '../services/ollama-embedding.service.js';
import { PdfChunkingService } from '../services/pdf-chunking.service.js';
import { PdfExtractionService } from '../services/pdf-extraction.service.js';

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly pdfExtractionService: PdfExtractionService,
    private readonly pdfChunkingService: PdfChunkingService,
    private readonly ollamaEmbeddingService: OllamaEmbeddingService,
  ) {}

  @Post('extract')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PDF_SIZE_BYTES } }),
  )
  async extract(@UploadedFile() file?: PdfUpload) {
    this.validateFile(file);

    return this.extractPdf(file.buffer);
  }

  @Post('embed')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PDF_SIZE_BYTES } }),
  )
  async embed(
    @UploadedFile() file?: PdfUpload,
  ): Promise<EmbedDocumentResponseDto> {
    this.validateFile(file);

    const document = await this.extractPdf(file.buffer);
    const chunks = this.pdfChunkingService.chunk(document);

    if (chunks.length === 0) {
      throw new BadRequestException(
        'O PDF não possui texto para gerar embeddings.',
      );
    }

    try {
      const embeddingResult = await this.ollamaEmbeddingService.embed(
        chunks.map((chunk) => chunk.text),
      );

      return {
        model: embeddingResult.model,
        dimensions: embeddingResult.embeddings[0]?.length ?? 0,
        chunks: chunks.map((chunk, index) => ({
          ...chunk,
          embedding: embeddingResult.embeddings[index],
        })),
      };
    } catch {
      throw new BadGatewayException(
        'Não foi possível gerar embeddings usando o Ollama.',
      );
    }
  }

  private validateFile(file?: PdfUpload): asserts file is PdfUpload {
    if (!file) {
      throw new BadRequestException('Envie um arquivo PDF no campo "file".');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('O arquivo precisa ser um PDF.');
    }

    if (file.buffer.length > MAX_PDF_SIZE_BYTES) {
      throw new PayloadTooLargeException('O PDF não pode exceder 10 MB.');
    }
  }

  private async extractPdf(buffer: Buffer) {
    try {
      return await this.pdfExtractionService.extract(buffer);
    } catch {
      throw new BadRequestException(
        'Não foi possível extrair o conteúdo do arquivo PDF.',
      );
    }
  }
}
