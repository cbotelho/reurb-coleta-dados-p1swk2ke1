import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Home, Folder, RefreshCw, Settings, LogOut, Map } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface SideDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const location = useLocation()
  const { logout, user } = useAuth()

  const NavItem = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string
    icon: any
    label: string
  }) => {
    const isActive = location.pathname === to
    return (
      <Link to={to} onClick={onClose}>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-base h-12',
            isActive
              ? 'bg-blue-50 text-blue-600 font-semibold'
              : 'text-gray-600 hover:bg-gray-50',
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Button>
      </Link>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-[80%] sm:w-[300px] p-0 flex flex-col"
      >
        <SheetHeader className="p-6 bg-blue-600 text-white text-left">
          <SheetTitle className="text-white text-xl">REURB Coleta</SheetTitle>
          <SheetDescription className="text-blue-100">
            Logado como: {user?.name}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-1 p-4">
          <NavItem to="/" icon={Home} label="Dashboard" />
          <NavItem to="/projetos" icon={Folder} label="Projetos" />
          <NavItem to="/mapa" icon={Map} label="Mapa Interativo" />
          <NavItem to="/sincronizacao" icon={RefreshCw} label="Sincronização" />
        </div>

        <div className="mt-auto border-t p-4 space-y-2">
          <NavItem to="/configuracoes" icon={Settings} label="Configurações" />

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              onClose()
              logout()
            }}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
