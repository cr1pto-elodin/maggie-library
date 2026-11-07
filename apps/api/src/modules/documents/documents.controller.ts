import {
  BadGatewayException,
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OllamaEmbeddingService } from './ollama-embedding.service.js';
import { PdfChunkingService } from './pdf-chunking.service.js';
import { PdfExtractionService } from './pdf-extraction.service.js';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly pdfExtractionService: PdfExtractionService,
    private readonly pdfChunkingService: PdfChunkingService,
    private readonly ollamaEmbeddingService: OllamaEmbeddingService,
  ) {}

  @Post('extract')
  @UseInterceptors(FileInterceptor('file'))
  async extract(
    @UploadedFile() file?: { buffer: Buffer; mimetype: string },
  ) {
    this.validateFile(file);

    try {
      return await this.pdfExtractionService.extract(file.buffer);
    } catch {
      throw new BadRequestException(
        'Não foi possível extrair o conteúdo do arquivo PDF.',
      );
    }
  }

  @Post('embed')
  @UseInterceptors(FileInterceptor('file'))
  async embed(
    @UploadedFile() file?: { buffer: Buffer; mimetype: string },
  ) {
    this.validateFile(file);

    try {
      const document = await this.pdfExtractionService.extract(file.buffer);
      const chunks = this.pdfChunkingService.chunk(document);

      if (chunks.length === 0) {
        throw new BadRequestException(
          'O PDF não possui texto para gerar embeddings.',
        );
      }

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
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadGatewayException(
        'Não foi possível gerar embeddings usando o Ollama.',
      );
    }
  }

  private validateFile(
    file?: { buffer: Buffer; mimetype: string },
  ): asserts file is { buffer: Buffer; mimetype: string } {
    if (!file) {
      throw new BadRequestException('Envie um arquivo PDF no campo "file".');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('O arquivo precisa ser um PDF.');
    }
  }
}
