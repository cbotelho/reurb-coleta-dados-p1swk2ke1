import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { PainelSincronizacao } from './PainelSincronizacao'

export default function Layout() {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      {/* Adjust padding for header and bottom nav */}
      <main
        className={cn(
          'flex-1 w-full max-w-7xl mx-auto p-4 md:p-6',
          'pt-[4.5rem] md:pt-[5.5rem]', // Top padding for header
          isMobile ? 'pb-20' : 'pb-6', // Bottom padding for nav
        )}
      >
        <PainelSincronizacao />
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
