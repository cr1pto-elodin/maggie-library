import type { LibraryDocument } from '../library.types'

interface DocumentCardProps {
  document: LibraryDocument
}

export function DocumentCard({ document }: DocumentCardProps) {
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
        <p>Indexado em {document.date}</p>

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
      </div>
    </article>
  )
}

