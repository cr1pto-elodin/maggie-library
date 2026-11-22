import { httpClient } from './http-client'
import type {
  DocumentsPage,
  DocumentSummary,
  IndexDocumentResponse,
  ReindexDocumentResponse,
} from './documents.types'

const PAGE_LIMIT = 100

async function getPage(page: number, signal?: AbortSignal) {
  const response = await httpClient.get<DocumentsPage>('/documents', {
    params: { page, limit: PAGE_LIMIT },
    signal,
  })

  return response.data
}

export const documentsService = {
  async delete(documentId: string): Promise<void> {
    await httpClient.delete(`/documents/${documentId}`)
  },

  async index(file: File): Promise<IndexDocumentResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await httpClient.post<IndexDocumentResponse>(
      '/documents/index',
      formData,
    )

    return response.data
  },

  async listAll(signal?: AbortSignal): Promise<DocumentSummary[]> {
    const firstPage = await getPage(1, signal)

    if (firstPage.pagination.totalPages <= 1) {
      return firstPage.items
    }

    const remainingPages = await Promise.all(
      Array.from(
        { length: firstPage.pagination.totalPages - 1 },
        (_, index) => getPage(index + 2, signal),
      ),
    )

    return [
      ...firstPage.items,
      ...remainingPages.flatMap((page) => page.items),
    ]
  },

  async reindex(
    documentId: string,
    file: File,
  ): Promise<ReindexDocumentResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await httpClient.post<ReindexDocumentResponse>(
      `/documents/${documentId}/reindex`,
      formData,
    )

    return response.data
  },
}
