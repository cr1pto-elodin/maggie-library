import { useMutation, useQueryClient } from '@tanstack/react-query'

import { documentsService } from '../../../../../services/documents.service'
import { documentsQueryKeys } from './documents-query-keys'

interface ReindexDocumentVariables {
  documentId: string
  file: File
}

export function useReindexDocumentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ documentId, file }: ReindexDocumentVariables) =>
      documentsService.reindex(documentId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.all }),
  })
}
