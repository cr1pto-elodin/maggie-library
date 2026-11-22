import { useActiveModule } from './hooks/use-active-module'
import { useTheme } from './hooks/use-theme'

const moduleMetadata = {
  library: {
    title: 'Biblioteca',
    subtitle: 'Consulte os documentos disponíveis para a Maggie.',
  },
  chat: {
    title: 'Chat',
    subtitle: 'Converse com a sua biblioteca de documentos.',
  },
}

export function useSignInController() {
  const { activeModule, selectModule } = useActiveModule()
  const { theme, toggleTheme } = useTheme()

  return {
    activeModule,
    selectModule,
    theme,
    toggleTheme,
    ...moduleMetadata[activeModule],
  }
}

