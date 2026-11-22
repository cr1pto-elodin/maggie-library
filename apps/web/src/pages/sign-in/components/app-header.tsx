import type { Theme } from '../hooks/use-theme'

interface AppHeaderProps {
  onToggleTheme: () => void
  title: string
  subtitle: string
  theme: Theme
}

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 15.4A8 8 0 0 1 8.6 4a8.2 8.2 0 1 0 11.4 11.4Z" />
    </svg>
  )
}

export function AppHeader({
  onToggleTheme,
  title,
  subtitle,
  theme,
}: AppHeaderProps) {
  const isDark = theme === 'dark'
  const themeLabel = isDark ? 'Ativar modo claro' : 'Ativar modo escuro'

  return (
    <header className="app-header">
      <div>
        <p className="app-header__eyebrow">Maggie Library</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="app-header__actions">
        <button
          aria-label={themeLabel}
          aria-pressed={isDark}
          className="theme-toggle"
          onClick={onToggleTheme}
          title={themeLabel}
          type="button"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="app-header__profile" aria-label="Perfil local">
          <span>VL</span>
          <div>
            <strong>Workspace local</strong>
            <small>Desenvolvimento</small>
          </div>
        </div>
      </div>
    </header>
  )
}

