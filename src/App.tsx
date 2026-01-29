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
import ProjetoNew from './pages/ProjetoNew'
import ProjetoEdit from './pages/ProjetoEdit'
import QuadraDetails from './pages/QuadraDetails'
import QuadraNew from './pages/QuadraNew'
import QuadraEdit from './pages/QuadraEdit'
import LoteForm from './pages/LoteForm'
import LoteFormUpdated from './pages/LoteFormUpdated'
import LoteEdit from './pages/LoteEdit'
import CSVImport from './pages/CSVImport'
import SyncStatus from './pages/SyncStatus'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import MapPage from './pages/MapPage'
import GeoAlerts from './pages/GeoAlerts'
import GeoAnalysis from './pages/GeoAnalysis'
import Settings from './pages/Settings'
import Users from './pages/Users'
import UserGroups from './pages/UserGroups'
import ReportConfig from './pages/ReportConfig'
import SavedCoordinates from './pages/SavedCoordinates'
import SocialReports from './pages/SocialReports'
import React from 'react'
import { StatusConexao } from './components/StatusConexao'

const LoadingSpinner = () => (
  <div className="h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium">Carregando...</p>
    </div>
  </div>
)

// Private Route Wrapper
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route Wrapper (redirects to home if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <AuthProvider>
        <SyncProvider>
          <Toaster />
          <Sonner />
          <StatusConexao />
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Navigate to="/projetos" replace />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/projetos/novo" element={<ProjetoNew />} />
              <Route path="/projetos/:projectId" element={<ProjetoDetails />} />
              <Route path="/projetos/:projectId/editar" element={<ProjetoEdit />} />
              <Route path="/projetos/:projectId/quadras/nova" element={<QuadraNew />} />
              <Route path="/quadras/:quadraId" element={<QuadraDetails />} />
              <Route path="/quadras/:quadraId/editar" element={<QuadraEdit />} />
              <Route path="/lotes/:loteId" element={<LoteFormUpdated />} />
              <Route path="/lotes/:loteId/editar" element={<LoteEdit />} />
              <Route
                path="/quadras/:quadraId/lotes/new"
                element={<LoteForm />}
              />
              <Route path="/sincronizacao" element={<SyncStatus />} />
              <Route path="/mapa" element={<MapPage />} />
              <Route path="/geo-alerts" element={<GeoAlerts />} />
              <Route path="/geo-analise" element={<GeoAnalysis />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route
                path="/configuracoes/coordenadas"
                element={<SavedCoordinates />}
              />
              <Route path="/users" element={<Users />} />
              <Route path="/groups" element={<UserGroups />} />
              <Route path="/pareceres" element={<SocialReports />} />
              <Route path="/relatorios/:projectId" element={<ReportConfig />} />
              <Route path="/importar-csv" element={<CSVImport />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SyncProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
