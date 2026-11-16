import { useActiveModule } from './hooks/use-active-module'

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

  return {
    activeModule,
    selectModule,
    ...moduleMetadata[activeModule],
  }
}

