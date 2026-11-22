import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EMBEDDING_DIMENSIONS } from '../../../../database/database.constants.js';
import {
  semanticSearchConfig,
  type SemanticSearchConfig,
} from '../../config/semantic-search.config.js';
import type { SemanticSearchResponseDto } from '../../dtos/semantic-search-response.dto.js';
import { DocumentsRepository } from '../../repositories/documents.repository.js';
import { OllamaEmbeddingService } from '../ollama-embedding/ollama-embedding.service.js';

const MAX_QUERY_LENGTH = 2_000;
const MAX_DOCUMENT_FILTERS = 100;
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ParsedSemanticSearchRequest {
  query: string;
  topK: number;
  minScore: number;
  documentIds?: string[];
}

@Injectable()
export class SemanticSearchService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly ollamaEmbeddingService: OllamaEmbeddingService,
    @Inject(semanticSearchConfig.KEY)
    private readonly config: SemanticSearchConfig,
  ) {}

  async search(input: unknown): Promise<SemanticSearchResponseDto> {
    const request = this.parseRequest(input);
    const embeddingResult = await this.generateQueryEmbedding(request.query);
    const embedding = embeddingResult.embeddings[0];

    if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new BadGatewayException(
        `O modelo de embeddings precisa retornar ${EMBEDDING_DIMENSIONS} dimensões.`,
      );
    }

    const results = await this.documentsRepository.search({
      embedding,
      embeddingModel: embeddingResult.model,
      embeddingDimensions: embedding.length,
      topK: request.topK,
      minScore: request.minScore,
      documentIds: request.documentIds,
    });

    return {
      model: embeddingResult.model,
      topK: request.topK,
      minScore: request.minScore,
      results,
    };
  }

  private async generateQueryEmbedding(query: string) {
    try {
      return await this.ollamaEmbeddingService.embed([query]);
    } catch {
      throw new BadGatewayException(
        'Não foi possível gerar o embedding da pergunta usando o Ollama.',
      );
    }
  }

  private parseRequest(input: unknown): ParsedSemanticSearchRequest {
    if (!this.isRecord(input)) {
      throw new BadRequestException('O corpo da busca precisa ser um objeto.');
    }

    const query = this.parseQuery(input.query);
    const topK = this.parseTopK(input.topK);
    const minScore = this.parseMinScore(input.minScore);
    const documentIds = this.parseDocumentIds(input.documentIds);

    return { query, topK, minScore, documentIds };
  }

  private parseQuery(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(
        'O campo "query" precisa ser um texto não vazio.',
      );
    }

    const query = value.trim();

    if (query.length > MAX_QUERY_LENGTH) {
      throw new BadRequestException(
        `O campo "query" deve ter no máximo ${MAX_QUERY_LENGTH} caracteres.`,
      );
    }

    return query;
  }

  private parseTopK(value: unknown): number {
    if (value === undefined) {
      return this.config.defaultTopK;
    }

    if (!Number.isSafeInteger(value) || (value as number) < 1) {
      throw new BadRequestException(
        'O campo "topK" precisa ser um número inteiro positivo.',
      );
    }

    if ((value as number) > this.config.maxTopK) {
      throw new BadRequestException(
        `O campo "topK" deve ser menor ou igual a ${this.config.maxTopK}.`,
      );
    }

    return value as number;
  }

  private parseMinScore(value: unknown): number {
    if (value === undefined) {
      return this.config.defaultMinScore;
    }

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < -1 ||
      value > 1
    ) {
      throw new BadRequestException(
        'O campo "minScore" precisa ser um número entre -1 e 1.',
      );
    }

    return value;
  }

  private parseDocumentIds(value: unknown): string[] | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      value.length > MAX_DOCUMENT_FILTERS ||
      !value.every(
        (documentId) =>
          typeof documentId === 'string' && UUID_V4_PATTERN.test(documentId),
      )
    ) {
      throw new BadRequestException(
        `O campo "documentIds" precisa ter entre 1 e ${MAX_DOCUMENT_FILTERS} UUIDs v4 válidos.`,
      );
    }

    return [...new Set(value as string[])];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
