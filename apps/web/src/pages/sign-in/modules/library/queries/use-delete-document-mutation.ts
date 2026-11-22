import { useMutation, useQueryClient } from '@tanstack/react-query'

import { documentsService } from '../../../../../services/documents.service'
import { documentsQueryKeys } from './documents-query-keys'

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => documentsService.delete(documentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.all }),
  })
}
