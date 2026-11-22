import { sql } from 'drizzle-orm';
import {
  bigint,
  char,
  check,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';
import { EMBEDDING_DIMENSIONS } from './database.constants.js';

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    checksumSha256: char('checksum_sha256', { length: 64 }).notNull().unique(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    pageCount: integer('page_count').notNull(),
    embeddingModel: text('embedding_model').notNull(),
    embeddingDimensions: smallint('embedding_dimensions').notNull(),
    chunkSize: integer('chunk_size').notNull(),
    chunkOverlap: integer('chunk_overlap').notNull(),
    revision: integer('revision').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check('documents_size_bytes_positive', sql`${table.sizeBytes} > 0`),
    check('documents_page_count_positive', sql`${table.pageCount} > 0`),
    check(
      'documents_embedding_dimensions_match_vector',
      sql`${table.embeddingDimensions} = ${sql.raw(String(EMBEDDING_DIMENSIONS))}`,
    ),
    check('documents_chunk_size_positive', sql`${table.chunkSize} > 0`),
    check('documents_revision_positive', sql`${table.revision} > 0`),
    check(
      'documents_chunk_overlap_valid',
      sql`${table.chunkOverlap} >= 0 AND ${table.chunkOverlap} < ${table.chunkSize}`,
    ),
  ],
);

export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    pageNumber: integer('page_number').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', {
      dimensions: EMBEDDING_DIMENSIONS,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('document_chunks_document_id_chunk_index_unique').on(
      table.documentId,
      table.chunkIndex,
    ),
    check(
      'document_chunks_chunk_index_non_negative',
      sql`${table.chunkIndex} >= 0`,
    ),
    check('document_chunks_page_number_positive', sql`${table.pageNumber} > 0`),
    check(
      'document_chunks_content_not_empty',
      sql`length(${table.content}) > 0`,
    ),
  ],
);
