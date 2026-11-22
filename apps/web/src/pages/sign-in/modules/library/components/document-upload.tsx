import { useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'

interface DocumentUploadProps {
  feedbackMessage: string
  feedbackStatus: 'idle' | 'success' | 'error'
  isPending: boolean
  onSelectFile: (file: File | null) => void
  onSubmit: () => void
  selectedFile: File | null
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
      <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  )
}

export function DocumentUpload({
  feedbackMessage,
  feedbackStatus,
  isPending,
  onSelectFile,
  onSubmit,
  selectedFile,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selectedFile && inputRef.current) {
      inputRef.current.value = ''
    }
  }, [selectedFile])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onSelectFile(event.target.files?.[0] ?? null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section
      className="document-upload"
      aria-labelledby="document-upload-title"
    >
      <div className="document-upload__intro">
        <span className="document-upload__icon" aria-hidden="true">
          <UploadIcon />
        </span>
        <div>
          <h2 id="document-upload-title">Adicionar documento</h2>
          <p>
            Selecione um PDF para extrair, vetorizar e incluir na biblioteca.
          </p>
        </div>
      </div>

      <form className="document-upload__form" onSubmit={handleSubmit}>
        <label className="document-upload__picker">
          <input
            accept="application/pdf,.pdf"
            disabled={isPending}
            onChange={handleChange}
            ref={inputRef}
            type="file"
          />
          <span>{selectedFile ? 'Alterar PDF' : 'Selecionar PDF'}</span>
        </label>
        <span className="document-upload__filename" title={selectedFile?.name}>
          {selectedFile?.name ?? 'Nenhum arquivo selecionado'}
        </span>
        <button disabled={!selectedFile || isPending} type="submit">
          {isPending ? 'Indexando...' : 'Indexar documento'}
        </button>
      </form>

      {feedbackMessage ? (
        <p
          aria-live="polite"
          className="document-upload__feedback"
          data-status={feedbackStatus}
          role={feedbackStatus === 'error' ? 'alert' : 'status'}
        >
          {feedbackMessage}
        </p>
      ) : null}
    </section>
  )
}
