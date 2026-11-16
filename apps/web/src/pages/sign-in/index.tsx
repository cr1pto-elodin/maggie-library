import { SignedInLayout } from './components/signed-in-layout'
import { ChatModule } from './modules/chat'
import { LibraryModule } from './modules/library'
import { useSignInController } from './sign-in.controller'
import './sign-in.css'

export function SignInPage() {
  const controller = useSignInController()

  return (
    <SignedInLayout
      activeModule={controller.activeModule}
      onSelectModule={controller.selectModule}
      subtitle={controller.subtitle}
      title={controller.title}
    >
      {controller.activeModule === 'library' ? (
        <LibraryModule />
      ) : (
        <ChatModule />
      )}
    </SignedInLayout>
  )
}

