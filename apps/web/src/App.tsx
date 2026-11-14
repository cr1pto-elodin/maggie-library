import { useState, type FormEvent } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copyStatus, setCopyStatus] = useState<
    'idle' | 'copied' | 'error'
  >('idle')

  const formattedResult = result ? JSON.stringify(result, null, 2) : ''

  async function handleRequest(endpoint: 'extract' | 'embed') {
    if (!file) {
      setError('Selecione um arquivo PDF antes de continuar.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setCopyStatus('idle')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/documents/${endpoint}`, {
        method: 'POST',
        body: formData,
      })
      const body = await response.json()

      if (!response.ok) {
        throw new Error(body.message ?? 'Não foi possível processar o PDF.')
      }

      setResult(body)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Ocorreu um erro ao chamar a API.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void handleRequest('extract')
  }

  function handleClear() {
    setFile(null)
    setResult(null)
    setError(null)
    setCopyStatus('idle')
  }

  async function handleCopyResult() {
    try {
      await navigator.clipboard.writeText(formattedResult)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Maggie Library</p>
        <h1>Extração de documentos</h1>
        <p className="intro">
          Envie um PDF para extrair o texto ou gerar embeddings com o Ollama.
        </p>

        <form onSubmit={handleSubmit} className="upload-form">
          <label htmlFor="pdf-file">Arquivo PDF</label>
          <input
            id="pdf-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setError(null)
              setResult(null)
              setCopyStatus('idle')
            }}
          />
          {file && <p className="file-name">Selecionado: {file.name}</p>}

          <div className="actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Processando...' : 'Extrair PDF'}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleRequest('embed')}
            >
              {isLoading ? 'Processando...' : 'Gerar embeddings'}
            </button>
            <button type="button" className="secondary" onClick={handleClear}>
              Limpar
            </button>
          </div>
        </form>

        {error && <p className="feedback error">{error}</p>}

        {result && (
          <section className="result" aria-live="polite">
            <div className="result-header">
              <h2>Resposta da API</h2>
              <button
                type="button"
                className="copy-button"
                aria-label="Copiar resposta"
                title={
                  copyStatus === 'copied'
                    ? 'Resposta copiada'
                    : 'Copiar resposta'
                }
                onClick={() => void handleCopyResult()}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
            </div>
            <span className="sr-only" aria-live="polite">
              {copyStatus === 'copied' ? 'Resposta copiada.' : ''}
            </span>
            <pre>{formattedResult}</pre>
            {copyStatus === 'error' && (
              <p className="feedback error">
                Não foi possível copiar a resposta.
              </p>
            )}
          </section>
        )}
      </section>
    </main>
  )
}

export default App
