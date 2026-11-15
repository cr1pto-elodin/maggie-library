import { createHash } from 'node:crypto';
import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EMBEDDING_DIMENSIONS } from '../../../../database/database.constants.js';
import {
  documentsConfig,
  type DocumentsConfig,
} from '../../config/documents.config.js';
import type { IndexDocumentResponseDto } from '../../dtos/index-document-response.dto.js';
import type { IndexedDocument } from '../../models/indexed-document.model.js';
import type { PdfUpload } from '../../models/pdf-upload.model.js';
import { DocumentsRepository } from '../../repositories/documents.repository.js';
import { OllamaEmbeddingService } from '../ollama-embedding/ollama-embedding.service.js';
import { PdfChunkingService } from '../pdf-chunking/pdf-chunking.service.js';
import { PdfExtractionService } from '../pdf-extraction/pdf-extraction.service.js';

@Injectable()
export class DocumentIndexingService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly pdfExtractionService: PdfExtractionService,
    private readonly pdfChunkingService: PdfChunkingService,
    private readonly ollamaEmbeddingService: OllamaEmbeddingService,
    @Inject(documentsConfig.KEY)
    private readonly config: DocumentsConfig,
  ) {}

  async index(file: PdfUpload): Promise<IndexDocumentResponseDto> {
    const checksumSha256 = createHash('sha256')
      .update(file.buffer)
      .digest('hex');
    const existingDocument =
      await this.documentsRepository.findByChecksum(checksumSha256);

    if (existingDocument) {
      return this.toResponse(existingDocument, 'already_indexed');
    }

    const document = await this.extractPdf(file.buffer);
    const chunks = this.pdfChunkingService.chunk(document);

    if (chunks.length === 0) {
      throw new BadRequestException(
        'O PDF não possui texto para gerar embeddings.',
      );
    }

    const embeddingResult = await this.generateEmbeddings(
      chunks.map((chunk) => chunk.text),
    );
    const embeddingDimensions = embeddingResult.embeddings[0]?.length ?? 0;

    if (embeddingDimensions !== EMBEDDING_DIMENSIONS) {
      throw new BadGatewayException(
        `O modelo de embeddings precisa retornar ${EMBEDDING_DIMENSIONS} dimensões.`,
      );
    }

    const result = await this.documentsRepository.createIfAbsent({
      checksumSha256,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      pageCount: document.totalPages,
      embeddingModel: embeddingResult.model,
      embeddingDimensions,
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
      chunks: chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddingResult.embeddings[index],
      })),
    });

    return this.toResponse(
      result.document,
      result.created ? 'indexed' : 'already_indexed',
    );
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

  private async generateEmbeddings(input: string[]) {
    try {
      return await this.ollamaEmbeddingService.embed(input);
    } catch {
      throw new BadGatewayException(
        'Não foi possível gerar embeddings usando o Ollama.',
      );
    }
  }

  private toResponse(
    document: IndexedDocument,
    status: IndexDocumentResponseDto['status'],
  ): IndexDocumentResponseDto {
    return {
      documentId: document.id,
      status,
      originalName: document.originalName,
      pageCount: document.pageCount,
      chunkCount: document.chunkCount,
      embeddingModel: document.embeddingModel,
      embeddingDimensions: document.embeddingDimensions,
    };
  }
}
