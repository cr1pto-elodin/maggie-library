import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ollamaConfig, type OllamaConfig } from '../../config/ollama.config.js';
import type { OllamaEmbeddingResult } from '../../models/ollama-embedding.model.js';

@Injectable()
export class OllamaEmbeddingService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(ollamaConfig.KEY)
    private readonly config: OllamaConfig,
  ) {}

  async embed(input: string[]): Promise<OllamaEmbeddingResult> {
    if (input.length === 0) {
      throw new Error('Informe ao menos um texto para gerar embeddings.');
    }

    const response = await firstValueFrom(
      this.httpService.post<unknown>(
        `${this.config.baseUrl}${this.config.embeddingPath}`,
        {
          model: this.config.embeddingModel,
          input,
        },
      ),
    );

    return this.validateResult(response.data, input.length);
  }

  private validateResult(
    value: unknown,
    expectedEmbeddings: number,
  ): OllamaEmbeddingResult {
    if (
      !this.isRecord(value) ||
      typeof value.model !== 'string' ||
      value.model.trim().length === 0
    ) {
      throw new Error('Ollama retornou uma resposta de embeddings inválida.');
    }

    if (
      !Array.isArray(value.embeddings) ||
      value.embeddings.length !== expectedEmbeddings
    ) {
      throw new Error(
        'Ollama retornou uma quantidade inesperada de embeddings.',
      );
    }

    const embeddings = value.embeddings;
    const dimensions = this.validateEmbedding(embeddings[0]);

    for (const embedding of embeddings.slice(1)) {
      if (this.validateEmbedding(embedding) !== dimensions) {
        throw new Error('Ollama retornou embeddings com dimensões diferentes.');
      }
    }

    return {
      model: value.model,
      embeddings: embeddings as number[][],
    };
  }

  private validateEmbedding(value: unknown): number {
    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      !value.every((item) => typeof item === 'number' && Number.isFinite(item))
    ) {
      throw new Error('Ollama retornou um embedding inválido.');
    }

    return value.length;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
