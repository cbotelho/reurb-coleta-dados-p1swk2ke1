import { useState } from 'react'
import { Menu, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SyncIndicator } from './SyncIndicator'
import { useLocation, useNavigate } from 'react-router-dom'
import { SideDrawer } from './SideDrawer'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isRoot =
    location.pathname === '/' ||
    location.pathname === '/projetos' ||
    location.pathname === '/sincronizacao'

  // Determine title based on route
  let title = 'REURB'
  if (location.pathname === '/') title = 'Dashboard'
  else if (location.pathname.startsWith('/projetos')) title = 'Projetos'
  else if (location.pathname.startsWith('/quadras'))
    title = 'Detalhes da Quadra'
  else if (location.pathname.startsWith('/lotes')) title = 'Formulário do Lote'
  else if (location.pathname === '/sincronizacao') title = 'Sincronização'

  // Contextual actions could be added here via a portal or context, but for now simple

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-blue-600 text-white z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-3">
          {isRoot ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-700"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-700"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-lg md:text-xl font-semibold truncate max-w-[200px] md:max-w-none">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <SyncIndicator />
        </div>
      </header>

      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  )
}
