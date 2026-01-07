import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { AIAssistant } from '@/components/dashboard/AIAssistant'
import { TipsCard } from '@/components/dashboard/TipsCard'
import { toast } from 'sonner'

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const p = await api.getProjects()
      setProjects(p)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar projetos.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewProject = () => {
    toast.info('Funcionalidade de criação iniciada', {
      description: 'O fluxo de novo projeto será aberto.',
    })
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Seus Projetos Ativos
          </h1>
          <Button
            onClick={handleNewProject}
            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 border-0 shadow-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Projects Grid */}
          <div className="lg:col-span-2 space-y-6">
            {projects.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-gray-500 mb-4">Nenhum projeto encontrado.</p>
                <Button variant="outline" onClick={handleNewProject}>
                  Criar Primeiro Projeto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.local_id} project={project} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Assistant & Tips */}
          <div className="space-y-6">
            <AIAssistant />
            <TipsCard />
          </div>
        </div>
      </div>
    </div>
  )
}
