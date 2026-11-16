import { useState } from 'react'

export function useChat() {
  const [draft, setDraft] = useState('')

  return {
    draft,
    setDraft,
  }
}

