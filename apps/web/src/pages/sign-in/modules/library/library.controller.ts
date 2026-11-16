import type { DocumentSummary } from '../../../../services/documents.types'
import { useDocuments } from './hooks/use-documents'
import type { LibraryDocument } from './library.types'

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
  const { documents, errorMessage, reload, status } = useDocuments()

  return {
    documents: documents.map(toLibraryDocument),
    errorMessage,
    reload,
    status,
    totalChunks: documents.reduce(
      (total, document) => total + document.chunkCount,
      0,
    ),
  }
}

