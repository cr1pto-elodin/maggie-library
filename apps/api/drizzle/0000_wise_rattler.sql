CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"page_number" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_chunks_chunk_index_non_negative" CHECK ("document_chunks"."chunk_index" >= 0),
	CONSTRAINT "document_chunks_page_number_positive" CHECK ("document_chunks"."page_number" > 0),
	CONSTRAINT "document_chunks_content_not_empty" CHECK (length("document_chunks"."content") > 0)
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checksum_sha256" char(64) NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"page_count" integer NOT NULL,
	"embedding_model" text NOT NULL,
	"embedding_dimensions" smallint NOT NULL,
	"chunk_size" integer NOT NULL,
	"chunk_overlap" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_checksum_sha256_unique" UNIQUE("checksum_sha256"),
	CONSTRAINT "documents_size_bytes_positive" CHECK ("documents"."size_bytes" > 0),
	CONSTRAINT "documents_page_count_positive" CHECK ("documents"."page_count" > 0),
	CONSTRAINT "documents_embedding_dimensions_match_vector" CHECK ("documents"."embedding_dimensions" = 768),
	CONSTRAINT "documents_chunk_size_positive" CHECK ("documents"."chunk_size" > 0),
	CONSTRAINT "documents_chunk_overlap_valid" CHECK ("documents"."chunk_overlap" >= 0 AND "documents"."chunk_overlap" < "documents"."chunk_size")
);
--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_chunks_document_id_chunk_index_unique" ON "document_chunks" USING btree ("document_id","chunk_index");
