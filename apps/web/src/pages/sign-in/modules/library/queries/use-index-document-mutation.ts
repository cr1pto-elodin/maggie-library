import { useMutation, useQueryClient } from '@tanstack/react-query'

import { documentsService } from '../../../../../services/documents.service'
import { documentsQueryKeys } from './documents-query-keys'

export function useIndexDocumentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => documentsService.index(file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: documentsQueryKeys.all }),
  })
}
