import { useEffect, useState } from 'react'

import { documentsService } from '../../../../../services/documents.service'
import type { DocumentSummary } from '../../../../../services/documents.types'
import { getRequestErrorMessage } from '../../../../../services/http-client'
import type { LibraryStatus } from '../library.types'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [status, setStatus] = useState<LibraryStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const abortController = new AbortController()

    async function loadDocuments() {
      setStatus('loading')
      setErrorMessage('')

      try {
        const result = await documentsService.listAll(abortController.signal)

        if (!abortController.signal.aborted) {
          setDocuments(result)
          setStatus('success')
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getRequestErrorMessage(
              error,
              'Não foi possível carregar os documentos.',
            ),
          )
          setStatus('error')
        }
      }
    }

    void loadDocuments()

    return () => abortController.abort()
  }, [requestVersion])

  return {
    documents,
    errorMessage,
    reload: () => setRequestVersion((version) => version + 1),
    status,
  }
}

