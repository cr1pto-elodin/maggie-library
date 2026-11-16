export function ChatEmptyState() {
  return (
    <div className="chat-empty-state">
      <span className="chat-empty-state__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M20 11.5a7.5 7.5 0 0 1-8 7.48 8.7 8.7 0 0 1-3.15-.86L4 20l1.62-4.22A7.5 7.5 0 1 1 20 11.5Z" />
          <path d="m9 11.5 2 2 4-4" />
        </svg>
      </span>
      <span className="chat-empty-state__badge">Em breve</span>
      <h2>Converse com a Maggie</h2>
      <p>
        A busca semântica usará os documentos da sua biblioteca para
        construir respostas contextualizadas.
      </p>
    </div>
  )
}

