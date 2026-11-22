import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm';
import { cosineDistance } from 'drizzle-orm/sql/functions/vector';
import { DATABASE } from '../../../database/database.constants.js';
import type { Database } from '../../../database/database.types.js';
import { documentChunks, documents } from '../../../database/schema.js';
import type {
  DocumentDetails,
  DocumentPage,
} from '../models/document-query.model.js';
import type {
  IndexedDocument,
  PersistDocumentInput,
  PersistDocumentResult,
  ReindexDocumentInput,
} from '../models/indexed-document.model.js';
import type {
  SemanticSearchCriteria,
  SemanticSearchResult,
} from '../models/semantic-search.model.js';

type DatabaseReader = Pick<Database, 'select'>;

@Injectable()
export class DocumentsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  findByChecksum(checksumSha256: string): Promise<IndexedDocument | null> {
    return this.selectDocument(
      this.database,
      eq(documents.checksumSha256, checksumSha256),
    );
  }

  findIndexedById(id: string): Promise<IndexedDocument | null> {
    return this.selectDocument(this.database, eq(documents.id, id));
  }

  async list(offset: number, limit: number): Promise<DocumentPage> {
    const [items, totalRows] = await Promise.all([
      this.database
        .select(this.documentSummarySelection())
        .from(documents)
        .leftJoin(documentChunks, eq(documentChunks.documentId, documents.id))
        .groupBy(documents.id)
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset),
      this.database.select({ total: count() }).from(documents),
    ]);

    return {
      items,
      total: totalRows[0]?.total ?? 0,
    };
  }

  async findById(id: string): Promise<DocumentDetails | null> {
    const document = await this.findIndexedById(id);

    if (!document) {
      return null;
    }

    const chunks = await this.database
      .select({
        id: documentChunks.id,
        index: documentChunks.chunkIndex,
        pageNumber: documentChunks.pageNumber,
        content: documentChunks.content,
        createdAt: documentChunks.createdAt,
      })
      .from(documentChunks)
      .where(eq(documentChunks.documentId, id))
      .orderBy(asc(documentChunks.chunkIndex));

    return { ...document, chunks };
  }

  search(criteria: SemanticSearchCriteria): Promise<SemanticSearchResult[]> {
    const distance = cosineDistance(
      documentChunks.embedding,
      criteria.embedding,
    );
    const score = sql<number>`1 - (${distance})`.mapWith(Number);

    return this.database
      .select({
        chunkId: documentChunks.id,
        documentId: documents.id,
        documentName: documents.originalName,
        chunkIndex: documentChunks.chunkIndex,
        pageNumber: documentChunks.pageNumber,
        content: documentChunks.content,
        score,
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documents.id, documentChunks.documentId))
      .where(
        and(
          eq(documents.embeddingModel, criteria.embeddingModel),
          eq(documents.embeddingDimensions, criteria.embeddingDimensions),
          lte(distance, 1 - criteria.minScore),
          criteria.documentIds
            ? inArray(documents.id, criteria.documentIds)
            : undefined,
        ),
      )
      .orderBy(asc(distance), asc(documents.id), asc(documentChunks.chunkIndex))
      .limit(criteria.topK);
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
        const existingDocument = await this.selectDocument(
          transaction,
          eq(documents.checksumSha256, input.checksumSha256),
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

  async deleteById(id: string): Promise<boolean> {
    const deletedDocuments = await this.database
      .delete(documents)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });

    return deletedDocuments.length > 0;
  }

  reindex(input: ReindexDocumentInput): Promise<IndexedDocument | null> {
    return this.database.transaction(async (transaction) => {
      const [updatedDocument] = await transaction
        .update(documents)
        .set({
          checksumSha256: input.checksumSha256,
          originalName: input.originalName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          pageCount: input.pageCount,
          embeddingModel: input.embeddingModel,
          embeddingDimensions: input.embeddingDimensions,
          chunkSize: input.chunkSize,
          chunkOverlap: input.chunkOverlap,
          revision: sql`${documents.revision} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(documents.id, input.documentId),
            eq(documents.revision, input.expectedRevision),
          ),
        )
        .returning();

      if (!updatedDocument) {
        return null;
      }

      await transaction
        .delete(documentChunks)
        .where(eq(documentChunks.documentId, input.documentId));

      await transaction.insert(documentChunks).values(
        input.chunks.map((chunk) => ({
          documentId: input.documentId,
          chunkIndex: chunk.index,
          pageNumber: chunk.pageNumber,
          content: chunk.text,
          embedding: chunk.embedding,
        })),
      );

      return {
        ...updatedDocument,
        chunkCount: input.chunks.length,
      };
    });
  }

  private async selectDocument(
    database: DatabaseReader,
    condition: SQL,
  ): Promise<IndexedDocument | null> {
    const [document] = await database
      .select(this.documentSelection())
      .from(documents)
      .leftJoin(documentChunks, eq(documentChunks.documentId, documents.id))
      .where(condition)
      .groupBy(documents.id)
      .limit(1);

    return document ?? null;
  }

  private documentSelection() {
    return {
      checksumSha256: documents.checksumSha256,
      ...this.documentSummarySelection(),
    };
  }

  private documentSummarySelection() {
    return {
      id: documents.id,
      originalName: documents.originalName,
      mimeType: documents.mimeType,
      sizeBytes: documents.sizeBytes,
      pageCount: documents.pageCount,
      embeddingModel: documents.embeddingModel,
      embeddingDimensions: documents.embeddingDimensions,
      chunkSize: documents.chunkSize,
      chunkOverlap: documents.chunkOverlap,
      chunkCount: count(documentChunks.id),
      revision: documents.revision,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    };
  }
}
