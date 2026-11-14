# Maggie Library

Maggie Library is a study project about **Retrieval-Augmented Generation (RAG)** running locally with [Ollama](https://ollama.com/). Its goal is to build and understand every stage of the architecture—from reading documents to semantic retrieval and generating answers grounded in sources.

The project prioritizes incremental implementations, verifiable contracts, and explanations of architectural decisions. At this point, the ingestion pipeline can extract PDFs, create chunks, and generate embeddings. The PostgreSQL and pgvector foundation is available, but the pipeline does not persist or query vectors yet.

## Current Status

Already implemented:

- PDF file uploads;
- configurable file type validation and size limit;
- text and metadata extraction by page;
- configurable chunking with overlap;
- embedding generation through Ollama;
- validation of embedding count, content, and dimensions;
- typed and validated configuration;
- global HTTP client with a configurable timeout;
- local PostgreSQL 17 infrastructure with pgvector;
- typed Drizzle schema and versioned database migrations;
- web interface for extraction and embedding generation;
- unit and end-to-end HTTP tests.

Not implemented yet:

- document and vector persistence through the ingestion pipeline;
- similarity search;
- answer generation using retrieved passages;
- citations and conversation history.

## Current Pipeline

```text
PDF
 └─ text and metadata extraction by page
     └─ normalization and chunking
         └─ embedding generation through Ollama
             └─ HTTP response with chunks and vectors
```

The flow currently ends with the HTTP response. Vectors are not stored yet.

## Architecture

```text
maggie-library/
├── compose.yaml                      # Local PostgreSQL with pgvector
├── apps/
│   ├── api/                         # NestJS API
│   │   ├── drizzle/                # Versioned SQL migrations
│   │   └── src/
│   │       ├── config/              # App bootstrap and environment readers
│   │       ├── database/            # Database config, connection, and schema
│   │       ├── modules/
│   │       │   ├── documents/       # Config, extraction, chunking, and embeddings
│   │       │   └── health/          # Basic API health check
│   │       └── shared/
│   │           └── http/            # Shared HTTP config and client
│   └── web/                         # React + Vite interface
└── README.md
```

Inside `documents/services`, each capability keeps its implementation and tests in the same directory:

```text
services/
├── ollama-embedding/
├── pdf-chunking/
└── pdf-extraction/
```

## Technologies

### API

- Node.js;
- TypeScript;
- NestJS;
- `@nestjs/config`;
- `@nestjs/axios` and Axios;
- PostgreSQL 17 with pgvector;
- Drizzle ORM and the `pg` driver;
- `pdf-parse`;
- Vitest and Supertest.

### Web

- React;
- TypeScript;
- Vite;
- ESLint.

### Local AI

- Ollama;
- `embeddinggemma` for embeddings;
- `llama3.2:3b` reserved for future answer generation.

## Prerequisites

- Node.js 24 or later;
- pnpm;
- Docker with Docker Compose;
- Ollama installed and running;
- the models used by the project available locally.

Pull the models configured by default:

```bash
ollama pull embeddinggemma
ollama pull llama3.2:3b
```

The chat model is already part of the configuration but is not used by the current pipeline.

## Configuration

The API and web applications have their own `.env.example` files. Copy them before the first run:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### API Variables

| Variable                       | Default                  | Purpose                                 |
| ------------------------------ | ------------------------ | --------------------------------------- |
| `PORT`                         | `4000`                   | API HTTP port                           |
| `API_PREFIX`                   | `api`                    | Global route prefix                     |
| `CORS_ORIGIN`                  | `http://localhost:5173`  | Origin allowed by CORS                  |
| `DATABASE_URL`                 | PostgreSQL on port 5433  | PostgreSQL connection string            |
| `DATABASE_POOL_MAX`            | `10`                     | Maximum connections in the API pool     |
| `HTTP_TIMEOUT_MS`              | `30000`                  | Default HTTP client timeout             |
| `DOCUMENT_MAX_FILE_SIZE_BYTES` | `10485760`               | Upload limit, equivalent to 10 MiB      |
| `DOCUMENT_CHUNK_SIZE`          | `1200`                   | Maximum number of characters per chunk  |
| `DOCUMENT_CHUNK_OVERLAP`       | `200`                    | Characters shared by consecutive chunks |
| `OLLAMA_URL`                   | `http://localhost:11434` | Ollama address                          |
| `OLLAMA_MODEL`                 | `llama3.2:3b`            | Future answer-generation model          |
| `OLLAMA_EMBEDDING_MODEL`       | `embeddinggemma`         | Model used to generate embeddings       |

Numeric settings and URLs are validated during startup. The overlap must be smaller than the chunk size.

### Web Variables

| Variable            | Default                 | Purpose                            |
| ------------------- | ----------------------- | ---------------------------------- |
| `VITE_API_BASE_URL` | `/api`                  | Base path used by browser requests |
| `API_PROXY_TARGET`  | `http://localhost:4000` | Vite development proxy target      |

## Installation

The repository does not have a single root command yet. Install dependencies in each application:

```bash
cd apps/api
pnpm install

cd ../web
pnpm install
```

## Database

Start the local PostgreSQL instance with pgvector:

```bash
docker compose up -d postgres
```

Apply all versioned migrations:

```bash
cd apps/api
pnpm run db:migrate
```

The initial migration enables the `vector` extension and creates two tables:

- `documents` stores the file identity, SHA-256 checksum, and indexing settings;
- `document_chunks` stores page references, chunk content, and `vector(768)` embeddings.

The Docker credentials are intended only for local development. Override `DATABASE_URL` for any other environment.

When the TypeScript schema changes, generate a new migration instead of editing a migration that has already been applied:

```bash
cd apps/api
pnpm run db:generate
```

## Local Development

With PostgreSQL and Ollama running, start the API:

```bash
cd apps/api
pnpm run start:dev
```

In another terminal, start the web application:

```bash
cd apps/web
pnpm run dev
```

Default addresses:

- web: `http://localhost:5173`;
- API: `http://localhost:4000/api`;
- Ollama: `http://localhost:11434`.

## Current Routes

| Method | Route                    | Description                           |
| ------ | ------------------------ | ------------------------------------- |
| `GET`  | `/api/health`            | Checks whether the API is responding  |
| `POST` | `/api/documents/extract` | Extracts text and metadata from a PDF |
| `POST` | `/api/documents/embed`   | Extracts, chunks, and embeds a PDF    |

The document endpoints accept `multipart/form-data` with the PDF in the `file` field.

Example:

```bash
curl -X POST \
  -F "file=@./document.pdf;type=application/pdf" \
  http://localhost:4000/api/documents/embed
```

## Validation

For the API:

```bash
cd apps/api
pnpm run test
pnpm run test:e2e
pnpm run lint
pnpm run build
pnpm run db:generate
```

For the web application:

```bash
cd apps/web
pnpm run lint
pnpm run build
```

The API test suite does not depend on a running Ollama instance: the HTTP integration is mocked in automated tests.

## Current Decisions and Trade-offs

### Character-Based Chunking

Chunk size and overlap are measured in characters. This approach is simple and deterministic, which makes it appropriate for the first study cycle, but it may split words or sentences. A sentence- or token-based strategy will be considered once retrieval evaluation can measure its benefits.

### Synchronous Processing

Extraction, chunking, and embedding generation happen within the same request. This keeps the flow easy to observe, but it may increase latency for large documents. Queues and workers will only be introduced when there is a demonstrated need.

### Shared HTTP Client

`HttpClientModule` centralizes transport settings such as timeout. The Ollama URL remains in integration-specific configuration so future HTTP clients are not coupled to the same server.

### Configuration Ownership

Services consume typed configuration through dependency injection. Generic environment reading and validation remain in the root `config/` layer, while each configuration namespace is registered by the module that owns it. Database, documents, Ollama, and HTTP settings therefore evolve with their consumers instead of accumulating in a global registry.

### Relational and Vector Schema

Documents and chunks use separate tables so document-level metadata is not repeated for every vector. A unique checksum prevents duplicate source files, while `(document_id, chunk_index)` preserves the chunk order and prevents duplicate positions. Deleting a document cascades to its chunks.

The embedding column is fixed at `vector(768)`, matching the current `embeddinggemma` output. Changing to a model with another dimension will require an explicit migration rather than silently mixing incompatible vectors.

### Exact Search Before Approximate Indexing

The initial schema does not create an HNSW or IVFFlat index. pgvector performs exact nearest-neighbor search by default, which is easier to evaluate and preserves full recall while the collection is small. Approximate indexing will be considered after retrieval quality and query latency are measured with representative data.

## Roadmap

### 1. Vector Persistence

- connect the existing ingestion pipeline to the database repository;
- store documents, metadata, chunks, and embeddings;
- use checksums to avoid duplicate indexing;
- define document reindexing and deletion.

### 2. Semantic Retrieval

- generate an embedding for the question;
- retrieve the nearest chunks;
- apply `top-k`, a score threshold, and metadata filters;
- return the score, document, page, and excerpt.

### 3. Retrieval Evaluation

- create reference documents and questions;
- measure whether expected chunks appear among the top results;
- compare chunk size, overlap, and embedding models;
- track relevance and latency.

### 4. Augmented Generation

- send only retrieved context to the chat model;
- instruct the model not to answer without supporting evidence;
- show the document, page, and excerpt used as sources;
- distinguish retrieval problems from generation problems.

### 5. User Experience

- indexed document library;
- processing status tracking;
- questions and answers with sources;
- reindexing and deletion;
- conversation history.

### Later Improvements

- OCR for scanned PDFs;
- hybrid text and vector search;
- reranking;
- response streaming;
- asynchronous indexing;
- metrics and observability;
- protection against malicious instructions contained in documents.

## Learning Goal

The final outcome is not merely a chat interface. The goal is to understand, in an observable and testable way, how document quality, chunking, embeddings, retrieval, context, and generation affect a complete RAG system.
