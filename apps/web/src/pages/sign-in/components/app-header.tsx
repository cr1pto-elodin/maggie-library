interface AppHeaderProps {
  title: string
  subtitle: string
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="app-header__eyebrow">Maggie Library</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="app-header__profile" aria-label="Perfil local">
        <span>VL</span>
        <div>
          <strong>Workspace local</strong>
          <small>Desenvolvimento</small>
        </div>
      </div>
    </header>
  )
}

