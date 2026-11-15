import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DATABASE } from '../../../database/database.constants.js';
import type { Database } from '../../../database/database.types.js';
import { documentChunks, documents } from '../../../database/schema.js';
import type {
  IndexedDocument,
  PersistDocumentInput,
  PersistDocumentResult,
} from '../models/indexed-document.model.js';

type DatabaseReader = Pick<Database, 'select'>;

@Injectable()
export class DocumentsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  findByChecksum(checksumSha256: string): Promise<IndexedDocument | null> {
    return this.selectByChecksum(this.database, checksumSha256);
  }

  createIfAbsent(input: PersistDocumentInput): Promise<PersistDocumentResult> {
    return this.database.transaction(async (transaction) => {
      const [insertedDocument] = await transaction
        .insert(documents)
        .values({
          checksumSha256: input.checksumSha256,
          originalName: input.originalName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          pageCount: input.pageCount,
          embeddingModel: input.embeddingModel,
          embeddingDimensions: input.embeddingDimensions,
          chunkSize: input.chunkSize,
          chunkOverlap: input.chunkOverlap,
        })
        .onConflictDoNothing({ target: documents.checksumSha256 })
        .returning();

      if (!insertedDocument) {
        const existingDocument = await this.selectByChecksum(
          transaction,
          input.checksumSha256,
        );

        if (!existingDocument) {
          throw new Error(
            'O documento existente não foi encontrado após o conflito de checksum.',
          );
        }

        return { document: existingDocument, created: false };
      }

      await transaction.insert(documentChunks).values(
        input.chunks.map((chunk) => ({
          documentId: insertedDocument.id,
          chunkIndex: chunk.index,
          pageNumber: chunk.pageNumber,
          content: chunk.text,
          embedding: chunk.embedding,
        })),
      );

      return {
        document: {
          ...insertedDocument,
          chunkCount: input.chunks.length,
        },
        created: true,
      };
    });
  }

  private async selectByChecksum(
    database: DatabaseReader,
    checksumSha256: string,
  ): Promise<IndexedDocument | null> {
    const [document] = await database
      .select({
        id: documents.id,
        checksumSha256: documents.checksumSha256,
        originalName: documents.originalName,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        pageCount: documents.pageCount,
        embeddingModel: documents.embeddingModel,
        embeddingDimensions: documents.embeddingDimensions,
        chunkSize: documents.chunkSize,
        chunkOverlap: documents.chunkOverlap,
        chunkCount: count(documentChunks.id),
        createdAt: documents.createdAt,
      })
      .from(documents)
      .leftJoin(documentChunks, eq(documentChunks.documentId, documents.id))
      .where(eq(documents.checksumSha256, checksumSha256))
      .groupBy(documents.id)
      .limit(1);

    return document ?? null;
  }
}
