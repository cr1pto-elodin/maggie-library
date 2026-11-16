import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ListDocumentsResponseDto } from '../../dtos/list-documents-response.dto.js';
import type { DocumentDetails } from '../../models/document-query.model.js';
import { DocumentsRepository } from '../../repositories/documents.repository.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class DocumentsQueryService {
  constructor(private readonly documentsRepository: DocumentsRepository) {}

  async list(
    rawPage?: string,
    rawLimit?: string,
  ): Promise<ListDocumentsResponseDto> {
    const page = this.parsePositiveInteger(rawPage, DEFAULT_PAGE, 'page');
    const limit = this.parsePositiveInteger(rawLimit, DEFAULT_LIMIT, 'limit');

    if (limit > MAX_LIMIT) {
      throw new BadRequestException(
        `O parâmetro "limit" deve ser menor ou igual a ${MAX_LIMIT}.`,
      );
    }

    const result = await this.documentsRepository.list(
      (page - 1) * limit,
      limit,
    );

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async findById(id: string): Promise<DocumentDetails> {
    const document = await this.documentsRepository.findById(id);

    if (!document) {
      throw new NotFoundException('Documento não encontrado.');
    }

    return document;
  }

  private parsePositiveInteger(
    value: string | undefined,
    fallback: number,
    parameter: string,
  ): number {
    if (value === undefined) {
      return fallback;
    }

    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(
        `O parâmetro "${parameter}" deve ser um número inteiro positivo.`,
      );
    }

    const parsedValue = Number(value);

    if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
      throw new BadRequestException(
        `O parâmetro "${parameter}" deve ser um número inteiro positivo.`,
      );
    }

    return parsedValue;
  }
}
