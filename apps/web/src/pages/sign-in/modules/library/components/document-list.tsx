import type { LibraryDocument } from '../library.types'
import { DocumentCard } from './document-card'

interface DocumentListProps {
  deletingDocumentId: string | null
  documents: LibraryDocument[]
  onDelete: (document: LibraryDocument) => void
  onReindex: (documentId: string, file: File) => void
  reindexingDocumentId: string | null
}

export function DocumentList({
  deletingDocumentId,
  documents,
  onDelete,
  onReindex,
  reindexingDocumentId,
}: DocumentListProps) {
  return (
    <div className="document-list">
      {documents.map((document) => (
        <DocumentCard
          document={document}
          isDeleting={deletingDocumentId === document.id}
          isReindexing={reindexingDocumentId === document.id}
          key={document.id}
          onDelete={() => onDelete(document)}
          onReindex={(file) => onReindex(document.id, file)}
        />
      ))}
    </div>
  )
}
