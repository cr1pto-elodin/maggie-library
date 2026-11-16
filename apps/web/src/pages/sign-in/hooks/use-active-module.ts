import { useState } from 'react'

import type { ActiveModule } from '../sign-in.types'

export function useActiveModule() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('library')

  return {
    activeModule,
    selectModule: setActiveModule,
  }
}

