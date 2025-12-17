import { useState, useEffect } from 'react'
import { db } from '@/services/db'
import { Project, Lote } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function MapPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [lotes, setLotes] = useState<Lote[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | undefined>()

  useEffect(() => {
    const projs = db.getProjects()
    setProjects(projs)
    if (projs.length > 0) {
      // Default to first project
      setSelectedProjectId(projs[0].local_id)
    }
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      setLotes(
        db.getAllLotes().filter((l) => {
          // Need to find if lote belongs to a quadra that belongs to this project
          // This is expensive in a real app, but ok for demo memory DB
          const quadra = db.getQuadra(l.parent_item_id)
          return quadra?.parent_item_id === selectedProjectId
        }),
      )
      setSelectedProject(db.getProject(selectedProjectId))
    }
  }, [selectedProjectId])

  const getProjectImage = (p?: Project) => {
    if (p?.field_351) return p.field_351
    return 'https://img.usecurling.com/p/1200/800?q=city%20map%20top%20view&color=blue'
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6 text-blue-600" />
            Mapa Interativo
          </h2>
        </div>
        <div className="w-[200px]">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o Projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.local_id} value={p.local_id}>
                  {p.field_348}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden relative bg-slate-100 border-2 border-slate-200">
        {/* Map Container */}
        <div className="absolute inset-0 overflow-auto">
          <div className="relative min-w-[800px] min-h-[600px] w-full h-full">
            <img
              src={getProjectImage(selectedProject)}
              alt="Project Map"
              className="w-full h-full object-cover opacity-80"
            />

            {/* Lotes Pins */}
            {lotes.map((lote) => (
              <Link
                key={lote.local_id}
                to={`/lotes/${lote.local_id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:z-10 group"
                style={{
                  left: `${lote.coordinates?.x || 50}%`,
                  top: `${lote.coordinates?.y || 50}%`,
                }}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-150 cursor-pointer',
                    lote.sync_status === 'synchronized'
                      ? 'bg-green-500'
                      : lote.sync_status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-orange-500',
                  )}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {lote.field_338}
                  <br />
                  <span className="text-[10px] opacity-80">
                    {lote.sync_status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg text-xs space-y-2 backdrop-blur-sm">
          <div className="font-semibold mb-1">Legenda</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" /> Sincronizado
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" /> Pendente
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" /> Falha
          </div>
          <div className="mt-2 pt-2 border-t text-gray-500">
            Total exibido: {lotes.length}
          </div>
        </div>
      </Card>
    </div>
  )
}
