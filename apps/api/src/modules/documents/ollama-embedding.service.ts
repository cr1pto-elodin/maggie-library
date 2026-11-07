import { Injectable } from '@nestjs/common';

export interface OllamaEmbeddingResult {
  model: string;
  embeddings: number[][];
}

@Injectable()
export class OllamaEmbeddingService {
  private readonly baseUrl =
    process.env.OLLAMA_URL ?? 'http://localhost:11434';

  private readonly model =
    process.env.OLLAMA_EMBEDDING_MODEL ?? 'embeddinggemma';

  async embed(input: string[]): Promise<OllamaEmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama respondeu com status ${response.status}.`);
    }

    return (await response.json()) as OllamaEmbeddingResult;
  }
}
