import type { LibraryStatus } from '../library.types'

interface LibraryFeedbackProps {
  errorMessage: string
  onRetry: () => void
  status: LibraryStatus
}

export function LibraryFeedback({
  errorMessage,
  onRetry,
  status,
}: LibraryFeedbackProps) {
  if (status === 'loading') {
    return (
      <div className="library-skeleton" aria-label="Carregando documentos">
        {[1, 2, 3].map((item) => (
          <div key={item} />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="library-feedback" role="alert">
        <strong>Falha ao acessar a biblioteca</strong>
        <p>{errorMessage}</p>
        <button type="button" onClick={onRetry}>
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="library-feedback">
      <strong>Sua biblioteca está vazia</strong>
      <p>Os documentos indexados aparecerão aqui.</p>
    </div>
  )
}

