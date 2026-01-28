import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { UserGroup } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Edit2, Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const AVAILABLE_PERMISSIONS = [
  { id: 'all', label: 'Acesso Total (Super Admin)' },
  { id: 'manage_users', label: 'Gerenciar Usuários' },
  { id: 'manage_groups', label: 'Gerenciar Grupos' },
  { id: 'edit_projects', label: 'Editar Projetos/Lotes' },
  { id: 'view_reports', label: 'Visualizar Relatórios' },
  { id: 'view_only', label: 'Apenas Visualização' },
]

export function UserGroupsManager() {
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<Partial<UserGroup>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.getGroups()
      console.log('Grupos recebidos do Supabase:', data)
      setGroups(data)
      if (!data || data.length === 0) {
        toast.error('Nenhum grupo retornado do Supabase. Verifique permissões, RLS ou erros de consulta.')
      }
    } catch (e: any) {
      toast.error('Erro ao carregar grupos: ' + (e?.message || e))
      console.error('Erro ao carregar grupos:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentGroup.name) {
      toast.error('O nome do grupo é obrigatório')
      return
    }

    setSaving(true)
    try {
      // Force 'all' permission if 'all' is selected
      const permissions = currentGroup.permissions || []

      const groupData: Partial<UserGroup> = {
        id: currentGroup.id,
        name: currentGroup.name,
        description: currentGroup.description,
        permissions: permissions,
      }

      await api.saveGroup(groupData)
      toast.success(currentGroup.id ? 'Grupo atualizado' : 'Grupo criado')
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar grupo')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este grupo?')) {
      try {
        await api.deleteGroup(id)
        toast.success('Grupo removido')
        loadData()
      } catch (error: any) {
        toast.error('Erro ao remover grupo')
      }
    }
  }

  const openEdit = (g: UserGroup) => {
    setCurrentGroup({ ...g })
    setIsDialogOpen(true)
  }

  const openNew = () => {
    setCurrentGroup({
      name: '',
      description: '',
      permissions: [],
    })
    setIsDialogOpen(true)
  }

  const togglePermission = (permId: string) => {
    const currentPerms = currentGroup.permissions || []
    if (currentPerms.includes(permId)) {
      setCurrentGroup({
        ...currentGroup,
        permissions: currentPerms.filter((p) => p !== permId),
      })
    } else {
      let newPerms = [...currentPerms, permId]
      if (permId === 'all') {
        newPerms = ['all']
      }
      setCurrentGroup({
        ...currentGroup,
        permissions: newPerms,
      })
    }
  }

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Gerenciamento de Grupos
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure grupos e atribua permissões específicas.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Grupo
        </Button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  {g.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {g.description || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {g.permissions.includes('all') ? (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                        Acesso Total
                      </Badge>
                    ) : (
                      g.permissions.slice(0, 3).map((p) => (
                        <Badge
                          key={p}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {AVAILABLE_PERMISSIONS.find((ap) => ap.id === p)
                            ?.label || p}
                        </Badge>
                      ))
                    )}
                    {g.permissions.length > 3 &&
                      !g.permissions.includes('all') && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{g.permissions.length - 3}
                        </Badge>
                      )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(g)}
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(g.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {groups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum grupo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentGroup.id ? 'Editar Grupo' : 'Novo Grupo'}
            </DialogTitle>
            <DialogDescription>
              Defina as características e permissões do grupo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Grupo</Label>
              <Input
                value={currentGroup.name}
                onChange={(e) =>
                  setCurrentGroup({ ...currentGroup, name: e.target.value })
                }
                placeholder="Ex: Equipe de Campo"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={currentGroup.description}
                onChange={(e) =>
                  setCurrentGroup({
                    ...currentGroup,
                    description: e.target.value,
                  })
                }
                placeholder="Breve descrição da função do grupo..."
              />
            </div>

            <div className="space-y-3">
              <Label>Permissões do Sistema</Label>
              <div className="grid grid-cols-1 gap-3 border rounded-lg p-4 bg-slate-50 max-h-[200px] overflow-y-auto">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isChecked = currentGroup.permissions?.includes(perm.id)
                  return (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-${perm.id}`}
                        checked={isChecked}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <label
                        htmlFor={`perm-${perm.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {perm.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function UserGroupsPage() {
  return (
    <div className="pb-20">
      <UserGroupsManager />
    </div>
  )
}
