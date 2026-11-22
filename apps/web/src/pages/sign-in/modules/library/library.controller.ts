import { useState } from 'react'

import type { DocumentSummary } from '../../../../services/documents.types'
import { getRequestErrorMessage } from '../../../../services/http-client'
import type { LibraryDocument, LibraryStatus } from './library.types'
import { useDocumentsQuery } from './queries/use-documents-query'
import { useIndexDocumentMutation } from './queries/use-index-document-mutation'

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
  const indexDocumentMutation = useIndexDocumentMutation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
    selectFile: (file: File | null) => {
      indexDocumentMutation.reset()
      setSelectedFile(file)
    },
    selectedFile,
    status,
    totalChunks: documents.reduce(
      (total, document) => total + document.chunkCount,
      0,
    ),
    upload: () => {
      if (!selectedFile || indexDocumentMutation.isPending) {
        return
      }

      indexDocumentMutation.mutate(selectedFile, {
        onSuccess: () => setSelectedFile(null),
      })
    },
    uploadFeedback: indexDocumentMutation.isError
      ? {
          message: getRequestErrorMessage(
            indexDocumentMutation.error,
            'Não foi possível indexar o documento.',
          ),
          status: 'error' as const,
        }
      : indexDocumentMutation.isSuccess
        ? {
            message:
              indexDocumentMutation.data.status === 'already_indexed'
                ? 'Este PDF já estava indexado na biblioteca.'
                : `Documento indexado com ${indexDocumentMutation.data.chunkCount} trechos.`,
            status: 'success' as const,
          }
        : { message: '', status: 'idle' as const },
    uploadPending: indexDocumentMutation.isPending,
  }
}
