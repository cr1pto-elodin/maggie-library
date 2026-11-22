import type { ChangeEvent } from 'react'

import type { LibraryDocument } from '../library.types'

interface DocumentCardProps {
  document: LibraryDocument
  isDeleting: boolean
  isReindexing: boolean
  onDelete: () => void
  onReindex: (file: File) => void
}

export function DocumentCard({
  document,
  isDeleting,
  isReindexing,
  onDelete,
  onReindex,
}: DocumentCardProps) {
  function handleReindexFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      onReindex(file)
    }

    event.target.value = ''
  }

  return (
    <article className="document-card">
      <div className="document-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M6 2.75h8l4 4V21.25H6V2.75Z" />
          <path d="M14 2.75v4h4M8.75 12h6.5M8.75 15.5h6.5" />
        </svg>
      </div>

      <div className="document-card__content">
        <div className="document-card__title-row">
          <h3 title={document.name}>{document.name}</h3>
          <span>PDF</span>
        </div>
        <p>Atualizado em {document.date}</p>

        <div className="document-card__metadata">
          <span>{document.size}</span>
          <span>
            {document.pageCount} {document.pageCount === 1 ? 'página' : 'páginas'}
          </span>
          <span>{document.chunkCount} chunks</span>
        </div>

        <div className="document-card__model">
          <span aria-hidden="true" />
          {document.embeddingModel}
        </div>

        <div className="document-card__actions">
          <label>
            <input
              accept="application/pdf,.pdf"
              disabled={isDeleting || isReindexing}
              onChange={handleReindexFile}
              type="file"
            />
            <span>{isReindexing ? 'Reindexando...' : 'Reindexar'}</span>
          </label>
          <button
            disabled={isDeleting || isReindexing}
            onClick={onDelete}
            type="button"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </article>
  )
}
