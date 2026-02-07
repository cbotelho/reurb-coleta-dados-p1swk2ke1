import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Home,
  Folder,
  RefreshCw,
  Settings,
  LogOut,
  Map,
  Users,
  Shield,
  PieChart,
  Bell,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface SideDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user, hasPermission } = useAuth()

  const NavItem = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string
    icon: any
    label: string
  }) => {
    const isActive = 
      location.pathname === to || 
      (to === '/dashboard' && location.pathname.startsWith('/dashboard')) ||
      (to === '/projetos' && location.pathname.startsWith('/projetos')) ||
      (to === '/users' && location.pathname.startsWith('/users')) ||
      (to === '/groups' && location.pathname.startsWith('/groups')) ||
      (to === '/configuracoes' && location.pathname.startsWith('/configuracoes'))
    
    return (
      <Link 
        to={to} 
        onClick={onClose}
      >
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-base h-12 px-4',
            isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Button>
      </Link>
    )
  }

  const canManageUsers = hasPermission('all') || hasPermission('manage_users')
  const canManageGroups = hasPermission('all') || hasPermission('manage_groups')
  const canViewReports = hasPermission('all') || hasPermission('view_reports')

  // Função para navegar para dashboard
  const handleDashboardClick = () => {
    // Navega para dashboard se não estiver lá
    if (location.pathname !== '/' && location.pathname !== '/Dashboard') {
      navigate('/')
    }
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-[80%] sm:w-[300px] p-0 flex flex-col border-r bg-background"
      >
        {/* Cabeçalho com logo */}
        <SheetHeader className="p-6 bg-primary text-primary-foreground text-left border-b">
          <div className="flex flex-col space-y-4">
            {/* Logo do sistema */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-primary-foreground/10 flex items-center justify-center p-1">
                <img 
                  src="/NextReurb_Logo.png" 
                  alt="NEXTREURB Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    // Fallback se a imagem não carregar
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="h-full w-full flex items-center justify-center">
                          <span class="text-primary-foreground font-bold text-xl">R</span>
                        </div>
                      `
                    }
                  }}
                />
              </div>
              <div>
                <SheetTitle className="text-primary-foreground text-xl font-bold">
                  NEXTREURB
                </SheetTitle>
                <SheetDescription className="text-primary-foreground/80 text-sm">
                  Coleta de Dados
                </SheetDescription>
              </div>
            </div>
            
            {/* Informação do usuário */}
            <div className="pt-3 border-t border-primary-foreground/20">
              <p className="text-primary-foreground/90 text-sm font-medium truncate">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-primary-foreground/70 text-xs truncate">
                {user?.username || user?.email || ''}
              </p>
              {user?.role && (
                <p className="text-primary-foreground/60 text-xs mt-1">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Menu de navegação */}
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto flex-1">
          {/* Dashboard - item especial */}
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 text-base h-12 px-4 mb-1',
              location.pathname === '/' || location.pathname === '/Dashboard'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
            onClick={handleDashboardClick}
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Button>

          {/* Demais itens do menu */}
          <NavItem to="/projetos" icon={Folder} label="Projetos" />
          <NavItem to="/mapa" icon={Map} label="Mapa Interativo" />
          <NavItem to="/geo-alerts" icon={Bell} label="Alertas Geográficos" />

          {canViewReports && (
            <NavItem
              to="/geo-analise"
              icon={PieChart}
              label="Análise Geográfica"
            />
          )}

          <NavItem to="/sincronizacao" icon={RefreshCw} label="Sincronização" />

          {canManageUsers && (
            <NavItem to="/users" icon={Users} label="Gerenciar Usuários" />
          )}

          {canManageGroups && (
            <NavItem to="/groups" icon={Shield} label="Grupos de Usuários" />
          )}
        </nav>

        {/* Rodapé com configurações e sair */}
        <div className="mt-auto border-t p-4 space-y-2 bg-muted/30">
          <NavItem to="/configuracoes" icon={Settings} label="Configurações" />

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 h-12 px-4"
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