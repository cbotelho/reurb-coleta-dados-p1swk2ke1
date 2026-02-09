import { useState } from 'react'
import { Menu, ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SyncIndicator } from './SyncIndicator'
import { useLocation, useNavigate } from 'react-router-dom'
import { SideDrawer } from './SideDrawer'
import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { user, logout } = useAuth()

  const isRoot =
    location.pathname === '/Dashboard' ||
    location.pathname === '/projetos' ||
    location.pathname === '/sincronizacao' ||
    location.pathname === '/mapa'

  let title = 'NextReurb v. 1.0.10'
  if (location.pathname === '/') title = 'Dashboard'
  else if (location.pathname.startsWith('/projetos')) title = 'Projetos'
  else if (location.pathname.startsWith('/quadras'))
    title = 'Detalhes da Quadra'
  else if (location.pathname.startsWith('/lotes')) title = 'Formulário do Lote'
  else if (location.pathname === '/sincronizacao') title = 'Sincronização'
  else if (location.pathname === '/mapa') title = 'Mapa Interativo'
  else if (location.pathname === '/configuracoes') title = 'Configurações'

  return (
    <>
      {/* 🟢 MUDANÇA PRINCIPAL: bg-primary em vez de bg-blue-600 */}
      <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-primary text-primary-foreground z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-3">
          {/* Botão de menu lateral nas rotas principais */}
          {isRoot ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary/90"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDrawerOpen(true)
              }}
              title="Abrir menu"
              type="button"
              tabIndex={0}
            >
              <Menu className="h-6 w-6" />
            </Button>
          ) : (
            <>
              {/* Botão de menu lateral nas rotas secundárias */}
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/90"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDrawerOpen(true)
                }}
                title="Abrir menu"
                type="button"
                tabIndex={0}
              >
                <Menu className="h-6 w-6" />
              </Button>
              {/* Botão voltar */}
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate(-1)}
                title="Voltar"
                type="button"
                tabIndex={0}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </>
          )}
          <h1 className="text-lg md:text-xl font-semibold truncate max-w-[200px] md:max-w-none">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <SyncIndicator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/90 rounded-full"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.username}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 focus:text-red-600"
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  )
}