import { useState, type FormEvent } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequest(endpoint: 'extract' | 'embed') {
    if (!file) {
      setError('Selecione um arquivo PDF antes de continuar.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

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
            <h2>Resposta da API</h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
