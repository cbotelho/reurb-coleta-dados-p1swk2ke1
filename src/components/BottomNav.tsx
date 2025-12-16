import { Home, Folder, RefreshCw } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

export function BottomNav() {
  const isMobile = useIsMobile()

  if (!isMobile) return null

  const NavItem = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string
    icon: any
    label: string
  }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
          isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700',
        )
      }
    >
      <Icon className="h-6 w-6" />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t flex items-center justify-around z-40 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <NavItem to="/" icon={Home} label="Dashboard" />
      <NavItem to="/projetos" icon={Folder} label="Projetos" />
      <NavItem to="/sincronizacao" icon={RefreshCw} label="Sincronização" />
    </nav>
  )
}
