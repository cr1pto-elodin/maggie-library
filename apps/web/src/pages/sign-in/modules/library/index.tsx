import { DocumentList } from './components/document-list'
import { DocumentUpload } from './components/document-upload'
import { LibraryFeedback } from './components/library-feedback'
import { useLibraryController } from './library.controller'
import './library.css'

export function LibraryModule() {
  const controller = useLibraryController()
  const hasDocuments =
    controller.status === 'success' && controller.documents.length > 0

  return (
    <section className="library-module">
      <DocumentUpload
        feedbackMessage={controller.uploadFeedback.message}
        feedbackStatus={controller.uploadFeedback.status}
        isPending={controller.uploadPending}
        onSelectFile={controller.selectFile}
        onSubmit={controller.upload}
        selectedFile={controller.selectedFile}
      />

      <div className="library-summary">
        <article>
          <span className="library-summary__icon" aria-hidden="true">
            DOC
          </span>
          <div>
            <strong>{controller.documents.length}</strong>
            <small>Documentos</small>
          </div>
        </article>
        <article>
          <span className="library-summary__icon" aria-hidden="true">
            AI
          </span>
          <div>
            <strong>{controller.totalChunks}</strong>
            <small>Trechos indexados</small>
          </div>
        </article>
      </div>

      <div className="library-toolbar">
        <div>
          <h2>Seus documentos</h2>
          <p>Conteúdo processado e pronto para consulta.</p>
        </div>
        <button
          className="secondary-button"
          disabled={controller.status === 'loading'}
          onClick={controller.reload}
          type="button"
        >
          Atualizar lista
        </button>
      </div>

      {hasDocuments ? (
        <DocumentList documents={controller.documents} />
      ) : (
        <LibraryFeedback
          errorMessage={controller.errorMessage}
          onRetry={controller.reload}
          status={controller.status}
        />
      )}
    </section>
  )
}

