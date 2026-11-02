import { Injectable } from '@nestjs/common';
import { PDFParse, type DateNode, type OutlineNode } from 'pdf-parse';
import type {
  PdfExtractionResult,
  PdfOutlineItem,
} from './pdf-extraction.types.js';

@Injectable()
export class PdfExtractionService {
  async extract(buffer: Buffer): Promise<PdfExtractionResult> {
    if (buffer.length === 0) {
      throw new Error('O arquivo PDF não pode estar vazio.');
    }

    const parser = new PDFParse({ data: buffer });

    try {
      const textResult = await parser.getText({
        parseHyperlinks: true,
        pageJoiner: '',
      });
      const infoResult = await parser.getInfo({ parsePageInfo: true });

      return {
        text: textResult.text,
        totalPages: textResult.total,
        pages: textResult.pages.map((page) => {
          const pageInfo = infoResult.pages.find(
            (item) => item.pageNumber === page.num,
          );

          return {
            pageNumber: page.num,
            pageLabel: pageInfo?.pageLabel ?? null,
            text: page.text,
            width: pageInfo?.width ?? null,
            height: pageInfo?.height ?? null,
            links: pageInfo?.links ?? [],
          };
        }),
        info: this.toRecord(infoResult.info),
        metadata: infoResult.metadata
          ? Object.fromEntries(infoResult.metadata)
          : null,
        dates: this.serializeDates(infoResult.getDateNode()),
        fingerprints: infoResult.fingerprints ?? [],
        permissions: infoResult.permission ?? null,
        outline: this.serializeOutline(infoResult.outline ?? []),
      };
    } finally {
      await parser.destroy();
    }
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private serializeDates(dates: DateNode): Record<string, string | null> {
    return Object.fromEntries(
      Object.entries(dates).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : null,
      ]),
    );
  }

  private serializeOutline(items: OutlineNode[]): PdfOutlineItem[] {
    return items.map((item) => ({
      title: item.title,
      bold: item.bold,
      italic: item.italic,
      color: Array.from(item.color),
      destination: item.dest,
      url: item.url,
      items: this.serializeOutline(item.items as OutlineNode[]),
    }));
  }
}
