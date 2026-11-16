import type { DocumentSummary } from '../../../../services/documents.types'
import { getRequestErrorMessage } from '../../../../services/http-client'
import type { LibraryDocument, LibraryStatus } from './library.types'
import { useDocumentsQuery } from './queries/use-documents-query'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  const units = ['KB', 'MB', 'GB']
  let size = sizeBytes / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
  }).format(size)} ${units[unitIndex]}`
}

function toLibraryDocument(document: DocumentSummary): LibraryDocument {
  return {
    id: document.id,
    name: document.originalName,
    size: formatFileSize(document.sizeBytes),
    date: dateFormatter.format(new Date(document.createdAt)),
    pageCount: document.pageCount,
    chunkCount: document.chunkCount,
    embeddingModel: document.embeddingModel,
  }
}

export function useLibraryController() {
  const documentsQuery = useDocumentsQuery()
  const documents = documentsQuery.data ?? []

  const status: LibraryStatus = documentsQuery.isPending
    ? 'loading'
    : documentsQuery.isError
      ? 'error'
      : 'success'

  return {
    documents: documents.map(toLibraryDocument),
    errorMessage: documentsQuery.error
      ? getRequestErrorMessage(
          documentsQuery.error,
          'Não foi possível carregar os documentos.',
        )
      : '',
    reload: () => void documentsQuery.refetch(),
    status,
    totalChunks: documents.reduce(
      (total, document) => total + document.chunkCount,
      0,
    ),
  }
}
