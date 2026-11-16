import type { LibraryDocument } from '../library.types'
import { DocumentCard } from './document-card'

interface DocumentListProps {
  documents: LibraryDocument[]
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <div className="document-list">
      {documents.map((document) => (
        <DocumentCard document={document} key={document.id} />
      ))}
    </div>
  )
}

