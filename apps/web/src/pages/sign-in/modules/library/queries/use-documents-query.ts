import { useQuery } from '@tanstack/react-query'

import { documentsService } from '../../../../../services/documents.service'
import { documentsQueryKeys } from './documents-query-keys'

export function useDocumentsQuery() {
  return useQuery({
    queryKey: documentsQueryKeys.list(),
    queryFn: ({ signal }) => documentsService.listAll(signal),
  })
}

