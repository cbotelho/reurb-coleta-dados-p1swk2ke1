import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SyncProvider } from '@/contexts/SyncContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projetos from './pages/Projetos'
import ProjetoDetails from './pages/ProjetoDetails'
import QuadraDetails from './pages/QuadraDetails'
import LoteForm from './pages/LoteForm'
import SyncStatus from './pages/SyncStatus'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import MapPage from './pages/MapPage'
import Settings from './pages/Settings'
import Users from './pages/Users'
import UserGroups from './pages/UserGroups'
import ReportConfig from './pages/ReportConfig'
import SavedCoordinates from './pages/SavedCoordinates'
import GeoAnalysis from './pages/GeoAnalysis'

// Private Route Wrapper
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        Carregando...
      </div>
    )

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <AuthProvider>
        <SyncProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/projetos/:projectId" element={<ProjetoDetails />} />
              <Route path="/quadras/:quadraId" element={<QuadraDetails />} />
              <Route path="/lotes/:loteId" element={<LoteForm />} />
              <Route
                path="/quadras/:quadraId/lotes/new"
                element={<LoteForm />}
              />
              <Route path="/sincronizacao" element={<SyncStatus />} />
              <Route path="/mapa" element={<MapPage />} />
              <Route path="/geo-analise" element={<GeoAnalysis />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route
                path="/configuracoes/coordenadas"
                element={<SavedCoordinates />}
              />
              <Route path="/users" element={<Users />} />
              <Route path="/groups" element={<UserGroups />} />
              <Route path="/relatorios/:projectId" element={<ReportConfig />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SyncProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
