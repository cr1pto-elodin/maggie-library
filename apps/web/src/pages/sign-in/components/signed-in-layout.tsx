import type { ReactNode } from 'react'

import type { ActiveModule } from '../sign-in.types'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

interface SignedInLayoutProps {
  activeModule: ActiveModule
  children: ReactNode
  onSelectModule: (module: ActiveModule) => void
  subtitle: string
  title: string
}

export function SignedInLayout({
  activeModule,
  children,
  onSelectModule,
  subtitle,
  title,
}: SignedInLayoutProps) {
  return (
    <div className="signed-in-layout">
      <AppSidebar
        activeModule={activeModule}
        onSelectModule={onSelectModule}
      />
      <main className="app-main">
        <AppHeader title={title} subtitle={subtitle} />
        <div className="app-content">{children}</div>
      </main>
    </div>
  )
}

