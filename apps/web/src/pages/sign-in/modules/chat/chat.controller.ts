import type { FormEvent } from 'react'

import { useChat } from './hooks/use-chat'

export function useChatController() {
  const { draft, setDraft } = useChat()

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return {
    draft,
    isSendAvailable: false,
    setDraft,
    submitMessage,
  }
}

