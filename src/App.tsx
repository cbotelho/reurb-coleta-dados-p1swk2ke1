import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SyncProvider } from '@/contexts/SyncContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projetos from './pages/Projetos'
import ProjetoDetails from './pages/ProjetoDetails'
import QuadraDetails from './pages/QuadraDetails'
import LoteForm from './pages/LoteForm'
import SyncStatus from './pages/SyncStatus'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <SyncProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/projetos/:projectId" element={<ProjetoDetails />} />
            <Route path="/quadras/:quadraId" element={<QuadraDetails />} />
            <Route path="/lotes/:loteId" element={<LoteForm />} />
            <Route path="/quadras/:quadraId/lotes/new" element={<LoteForm />} />
            <Route path="/sincronizacao" element={<SyncStatus />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SyncProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
