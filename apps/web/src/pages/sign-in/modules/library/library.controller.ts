import { useState } from 'react'

import type { DocumentSummary } from '../../../../services/documents.types'
import { getRequestErrorMessage } from '../../../../services/http-client'
import type { LibraryDocument, LibraryStatus } from './library.types'
import { useDeleteDocumentMutation } from './queries/use-delete-document-mutation'
import { useDocumentsQuery } from './queries/use-documents-query'
import { useIndexDocumentMutation } from './queries/use-index-document-mutation'
import { useReindexDocumentMutation } from './queries/use-reindex-document-mutation'

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
    date: dateFormatter.format(new Date(document.updatedAt)),
    pageCount: document.pageCount,
    chunkCount: document.chunkCount,
    embeddingModel: document.embeddingModel,
  }
}

export function useLibraryController() {
  const documentsQuery = useDocumentsQuery()
  const deleteDocumentMutation = useDeleteDocumentMutation()
  const indexDocumentMutation = useIndexDocumentMutation()
  const reindexDocumentMutation = useReindexDocumentMutation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const documents = documentsQuery.data ?? []

  const status: LibraryStatus = documentsQuery.isPending
    ? 'loading'
    : documentsQuery.isError
      ? 'error'
      : 'success'

  return {
    deleteDocument: (document: LibraryDocument) => {
      if (
        deleteDocumentMutation.isPending ||
        !window.confirm(
          `Excluir "${document.name}" e todos os seus trechos indexados?`,
        )
      ) {
        return
      }

      reindexDocumentMutation.reset()
      deleteDocumentMutation.mutate(document.id)
    },
    deletingDocumentId: deleteDocumentMutation.isPending
      ? deleteDocumentMutation.variables
      : null,
    documents: documents.map(toLibraryDocument),
    errorMessage: documentsQuery.error
      ? getRequestErrorMessage(
          documentsQuery.error,
          'Não foi possível carregar os documentos.',
        )
      : '',
    reload: () => void documentsQuery.refetch(),
    reindexDocument: (documentId: string, file: File) => {
      if (reindexDocumentMutation.isPending) {
        return
      }

      deleteDocumentMutation.reset()
      reindexDocumentMutation.mutate({ documentId, file })
    },
    reindexingDocumentId: reindexDocumentMutation.isPending
      ? reindexDocumentMutation.variables.documentId
      : null,
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
    lifecycleFeedback: deleteDocumentMutation.isError
      ? {
          message: getRequestErrorMessage(
            deleteDocumentMutation.error,
            'Não foi possível excluir o documento.',
          ),
          status: 'error' as const,
        }
      : reindexDocumentMutation.isError
        ? {
            message: getRequestErrorMessage(
              reindexDocumentMutation.error,
              'Não foi possível reindexar o documento.',
            ),
            status: 'error' as const,
          }
        : deleteDocumentMutation.isSuccess
          ? {
              message: 'Documento e trechos excluídos da biblioteca.',
              status: 'success' as const,
            }
          : reindexDocumentMutation.isSuccess
            ? {
                message: `Documento reindexado com ${reindexDocumentMutation.data.chunkCount} trechos (revisão ${reindexDocumentMutation.data.revision}).`,
                status: 'success' as const,
              }
            : { message: '', status: 'idle' as const },
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
