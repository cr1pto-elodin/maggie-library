export interface DocumentSummary {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  pageCount: number
  embeddingModel: string
  embeddingDimensions: number
  chunkSize: number
  chunkOverlap: number
  chunkCount: number
  createdAt: string
}

export interface DocumentsPage {
  items: DocumentSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface IndexDocumentResponse {
  documentId: string
  status: 'indexed' | 'already_indexed'
  originalName: string
  pageCount: number
  chunkCount: number
  embeddingModel: string
  embeddingDimensions: number
}
