import type { ActiveModule } from '../sign-in.types'

interface AppSidebarProps {
  activeModule: ActiveModule
  onSelectModule: (module: ActiveModule) => void
}

function LibraryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v16H7A2.5 2.5 0 0 0 4.5 21.5v-16Z" />
      <path d="M4.5 18.5A2.5 2.5 0 0 1 7 16h12.5" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.48 8.7 8.7 0 0 1-3.15-.86L4 20l1.62-4.22A7.5 7.5 0 1 1 20 11.5Z" />
      <path d="M8.5 11.5h7M8.5 8.5h4.5" />
    </svg>
  )
}

const navigationItems = [
  { id: 'library', label: 'Biblioteca', icon: <LibraryIcon /> },
  { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
] satisfies { id: ActiveModule; label: string; icon: React.ReactNode }[]

export function AppSidebar({
  activeModule,
  onSelectModule,
}: AppSidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="brand">
        <span className="brand__mark" aria-hidden="true">
          M
        </span>
        <span>
          <strong>Maggie</strong>
          <small>Library</small>
        </span>
      </div>

      <nav className="app-navigation" aria-label="Navegação principal">
        <span className="app-navigation__label">Espaço de trabalho</span>
        {navigationItems.map((item) => (
          <button
            className="app-navigation__item"
            data-active={activeModule === item.id}
            key={item.id}
            onClick={() => onSelectModule(item.id)}
            type="button"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <span className="status-dot" aria-hidden="true" />
        <span>
          <strong>Ambiente local</strong>
          <small>RAG com Ollama</small>
        </span>
      </div>
    </aside>
  )
}

