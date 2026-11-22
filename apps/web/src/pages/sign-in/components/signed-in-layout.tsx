import type { ReactNode } from 'react'

import type { ActiveModule } from '../sign-in.types'
import type { Theme } from '../hooks/use-theme'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

interface SignedInLayoutProps {
  activeModule: ActiveModule
  children: ReactNode
  onSelectModule: (module: ActiveModule) => void
  onToggleTheme: () => void
  subtitle: string
  theme: Theme
  title: string
}

export function SignedInLayout({
  activeModule,
  children,
  onSelectModule,
  onToggleTheme,
  subtitle,
  theme,
  title,
}: SignedInLayoutProps) {
  return (
    <div className="signed-in-layout">
      <AppSidebar
        activeModule={activeModule}
        onSelectModule={onSelectModule}
      />
      <main className="app-main">
        <AppHeader
          onToggleTheme={onToggleTheme}
          subtitle={subtitle}
          theme={theme}
          title={title}
        />
        <div className="app-content">{children}</div>
      </main>
    </div>
  )
}

