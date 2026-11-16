import type { FormEvent } from 'react'

interface ChatComposerProps {
  draft: string
  isSendAvailable: boolean
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ChatComposer({
  draft,
  isSendAvailable,
  onChange,
  onSubmit,
}: ChatComposerProps) {
  return (
    <form className="chat-composer" onSubmit={onSubmit}>
      <label htmlFor="chat-message">Mensagem</label>
      <div>
        <textarea
          id="chat-message"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Pergunte algo sobre os seus documentos..."
          rows={2}
          value={draft}
        />
        <button
          aria-label="Enviar mensagem"
          disabled={!isSendAvailable || draft.trim().length === 0}
          title="Disponível na próxima etapa"
          type="submit"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m4 4 17 8-17 8 3-8-3-8Z" />
            <path d="M7 12h14" />
          </svg>
        </button>
      </div>
      <small>O envio será habilitado com a busca semântica.</small>
    </form>
  )
}

