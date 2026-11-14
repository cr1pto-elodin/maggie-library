import { Injectable } from '@nestjs/common';
import type { OllamaEmbeddingResult } from '../models/ollama-embedding.model.js';

@Injectable()
export class OllamaEmbeddingService {
  private readonly baseUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434';

  private readonly model =
    process.env.OLLAMA_EMBEDDING_MODEL ?? 'embeddinggemma';

  private readonly timeoutMs = this.readTimeout();

  async embed(input: string[]): Promise<OllamaEmbeddingResult> {
    if (input.length === 0) {
      throw new Error('Informe ao menos um texto para gerar embeddings.');
    }

    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.timeoutMs),
      body: JSON.stringify({
        model: this.model,
        input,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama respondeu com status ${response.status}.`);
    }

    return this.validateResult(await response.json(), input.length);
  }

  private readTimeout(): number {
    const configuredTimeout = Number(process.env.OLLAMA_TIMEOUT_MS ?? 30_000);

    return Number.isSafeInteger(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 30_000;
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
