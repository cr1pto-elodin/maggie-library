import { createHash } from 'node:crypto';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EMBEDDING_DIMENSIONS } from '../../../../database/database.constants.js';
import {
  documentsConfig,
  type DocumentsConfig,
} from '../../config/documents.config.js';
import type { IndexDocumentResponseDto } from '../../dtos/index-document-response.dto.js';
import type { ReindexDocumentResponseDto } from '../../dtos/reindex-document-response.dto.js';
import type {
  IndexedDocument,
  PersistDocumentInput,
} from '../../models/indexed-document.model.js';
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
    const checksumSha256 = this.calculateChecksum(file);
    const existingDocument =
      await this.documentsRepository.findByChecksum(checksumSha256);

    if (existingDocument) {
      return this.toResponse(existingDocument, 'already_indexed');
    }

    const input = await this.prepareDocument(file, checksumSha256);
    const result = await this.documentsRepository.createIfAbsent(input);

    return this.toResponse(
      result.document,
      result.created ? 'indexed' : 'already_indexed',
    );
  }

  async reindex(
    id: string,
    file: PdfUpload,
  ): Promise<ReindexDocumentResponseDto> {
    const existingDocument = await this.documentsRepository.findIndexedById(id);

    if (!existingDocument) {
      throw new NotFoundException('Documento não encontrado.');
    }

    const checksumSha256 = this.calculateChecksum(file);

    if (checksumSha256 !== existingDocument.checksumSha256) {
      throw new ConflictException(
        'O PDF enviado não corresponde ao documento que será reindexado.',
      );
    }

    const input = await this.prepareDocument(file, checksumSha256);
    const reindexedDocument = await this.documentsRepository.reindex({
      ...input,
      documentId: id,
      expectedRevision: existingDocument.revision,
    });

    if (!reindexedDocument) {
      throw new ConflictException(
        'O documento foi alterado ou removido durante a reindexação.',
      );
    }

    return {
      documentId: reindexedDocument.id,
      status: 'reindexed',
      originalName: reindexedDocument.originalName,
      pageCount: reindexedDocument.pageCount,
      chunkCount: reindexedDocument.chunkCount,
      embeddingModel: reindexedDocument.embeddingModel,
      embeddingDimensions: reindexedDocument.embeddingDimensions,
      revision: reindexedDocument.revision,
    };
  }

  private async prepareDocument(
    file: PdfUpload,
    checksumSha256: string,
  ): Promise<PersistDocumentInput> {
    const document = await this.pdfExtractionService.extract(file.buffer);
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

    return {
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
    };
  }

  private calculateChecksum(file: PdfUpload): string {
    return createHash('sha256').update(file.buffer).digest('hex');
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
