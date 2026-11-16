import { useChatController } from './chat.controller'
import { ChatComposer } from './components/chat-composer'
import { ChatEmptyState } from './components/chat-empty-state'
import './chat.css'

export function ChatModule() {
  const controller = useChatController()

  return (
    <section className="chat-module">
      <ChatEmptyState />
      <ChatComposer
        draft={controller.draft}
        isSendAvailable={controller.isSendAvailable}
        onChange={controller.setDraft}
        onSubmit={controller.submitMessage}
      />
    </section>
  )
}

