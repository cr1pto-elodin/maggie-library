# Maggie Library

Maggie Library is a study project about **Retrieval-Augmented Generation (RAG)** running locally with [Ollama](https://ollama.com/). Its goal is to build and understand every stage of the architecture—from reading documents to semantic retrieval and generating answers grounded in sources.

The project prioritizes incremental implementations, verifiable contracts, and explanations of architectural decisions. At this point, the ingestion pipeline can extract PDFs, create chunks, and generate embeddings, but it does not persist or query vectors yet.

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
- web interface for extraction and embedding generation;
- unit and end-to-end HTTP tests.

Not implemented yet:

- database and document persistence;
- vector storage;
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
├── apps/
│   ├── api/                         # NestJS API
│   │   └── src/
│   │       ├── config/              # Typed configuration and validation
│   │       ├── modules/
│   │       │   ├── documents/       # Extraction, chunking, and embeddings
│   │       │   └── health/          # Basic API health check
│   │       └── shared/
│   │           └── http/            # Shared HTTP client
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

## Local Development

With Ollama running, start the API:

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

### Centralized Configuration

Services consume typed configuration through dependency injection. Environment access, defaults, and validation are restricted to the `config/` layer, preventing operational rules from spreading through business logic.

## Roadmap

### 1. Vector Persistence

- add PostgreSQL with `pgvector`;
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
