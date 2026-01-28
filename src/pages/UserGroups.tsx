import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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
import { Plus, Trash2, Edit2, Shield, Loader2, ShieldAlert } from 'lucide-react'
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
  const { hasPermission } = useAuth()
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [users, setUsers] = useState<any[]>([]) // Para armazenar todos os usuários
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
      const [groupsData, usersData] = await Promise.all([
        api.getGroups(),
        api.getUsers() // Buscar todos os usuários para verificar associações
      ])
      
      console.log('Grupos recebidos do Supabase:', groupsData)
      
      if (Array.isArray(groupsData)) {
        setGroups(groupsData)
        if (groupsData.length === 0) {
          console.warn('Nenhum grupo encontrado no banco de dados.')
        }
      } else {
        console.error('Resposta inválida do servidor para grupos:', groupsData)
        toast.error('Formato de resposta inválido do servidor')
        setGroups([])
      }
      
      if (Array.isArray(usersData)) {
        setUsers(usersData)
      }
    } catch (e: any) {
      console.error('Erro detalhado ao carregar dados:', e)
      
      if (e.status === 400) {
        toast.error('Erro na requisição ao banco de dados. Verifique as permissões RLS.')
      } else if (e.status === 401 || e.status === 403) {
        toast.error('Acesso não autorizado. Faça login novamente.')
      } else if (e.status === 404) {
        toast.error('Tabela não encontrada.')
      } else {
        toast.error(`Erro ao carregar dados: ${e.message || 'Erro de conexão'}`)
      }
      
      setGroups([])
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Função para verificar se há usuários em um grupo
  const hasUsersInGroup = (groupId: string): boolean => {
    return users.some(user => 
      user.groupIds && 
      Array.isArray(user.groupIds) && 
      user.groupIds.includes(groupId)
    )
  }

  // Security Check (RBAC)
  if (!hasPermission('all') && !hasPermission('manage_groups')) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
        <p className="text-gray-500 mt-2">
          Você não tem permissão para gerenciar grupos de usuários.
        </p>
      </div>
    )
  }

  const handleSave = async () => {
    if (!currentGroup.name || currentGroup.name.trim() === '') {
      toast.error('O nome do grupo é obrigatório')
      return
    }

    // Remove espaços em branco do nome
    const groupName = currentGroup.name.trim()

    setSaving(true)
    try {
      // Force 'all' permission if 'all' is selected
      const permissions = currentGroup.permissions || []

      const groupData: Partial<UserGroup> = {
        id: currentGroup.id,
        name: groupName,
        description: currentGroup.description?.trim() || '',
        permissions: permissions.includes('all') ? ['all'] : permissions,
      }

      await api.saveGroup(groupData)
      
      toast.success(currentGroup.id ? 'Grupo atualizado com sucesso' : 'Grupo criado com sucesso')
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      console.error('Erro ao salvar grupo:', error)
      toast.error(error.message || 'Erro ao salvar grupo. Verifique as permissões.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este grupo?')) {
      return
    }

    // Verificar se há usuários neste grupo antes de excluir
    if (hasUsersInGroup(id)) {
      toast.error('Não é possível excluir o grupo porque existem usuários associados a ele.')
      return
    }

    try {
      await api.deleteGroup(id)
      
      toast.success('Grupo removido com sucesso')
      loadData()
    } catch (error: any) {
      console.error('Erro ao remover grupo:', error)
      
      if (error.message?.includes('violates foreign key constraint')) {
        toast.error('Não é possível excluir o grupo porque existem usuários associados a ele.')
      } else {
        toast.error('Erro ao remover grupo. Verifique as permissões.')
      }
    }
  }

  const openEdit = (g: UserGroup) => {
    setCurrentGroup({ 
      ...g,
      permissions: g.permissions.includes('all') ? ['all'] : [...g.permissions]
    })
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
    
    if (permId === 'all') {
      // Se selecionar "all", remove todas as outras permissões
      if (currentPerms.includes('all')) {
        setCurrentGroup({
          ...currentGroup,
          permissions: [],
        })
      } else {
        setCurrentGroup({
          ...currentGroup,
          permissions: ['all'],
        })
      }
    } else {
      // Para outras permissões
      if (currentPerms.includes(permId)) {
        // Remove a permissão específica
        const newPerms = currentPerms.filter((p) => p !== permId)
        setCurrentGroup({
          ...currentGroup,
          permissions: newPerms,
        })
      } else {
        // Adiciona a permissão específica, removendo "all" se estiver presente
        const newPerms = currentPerms.filter((p) => p !== 'all')
        newPerms.push(permId)
        setCurrentGroup({
          ...currentGroup,
          permissions: newPerms,
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Gerenciamento de Grupos
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure grupos e atribua permissões específicas.
          </p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Grupo
        </Button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => {
              const usersCount = users.filter(user => 
                user.groupIds && 
                Array.isArray(user.groupIds) && 
                user.groupIds.includes(g.id)
              ).length
              
              return (
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
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                          Acesso Total
                        </Badge>
                      ) : (
                        <>
                          {g.permissions.slice(0, 3).map((p) => (
                            <Badge
                              key={p}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {AVAILABLE_PERMISSIONS.find((ap) => ap.id === p)
                                ?.label || p}
                            </Badge>
                          ))}
                          {g.permissions.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{g.permissions.length - 3}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usersCount > 0 ? "default" : "outline"}>
                      {usersCount} usuário{usersCount !== 1 ? 's' : ''}
                    </Badge>
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
                        disabled={usersCount > 0}
                        title={usersCount > 0 ? "Não é possível excluir grupo com usuários" : "Excluir grupo"}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {groups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center">
                    <Shield className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="font-medium">Nenhum grupo encontrado</p>
                    <p className="text-sm mt-1">Crie seu primeiro grupo clicando em "Novo Grupo"</p>
                  </div>
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
              <Label htmlFor="group-name">Nome do Grupo *</Label>
              <Input
                id="group-name"
                value={currentGroup.name || ''}
                onChange={(e) =>
                  setCurrentGroup({ ...currentGroup, name: e.target.value })
                }
                placeholder="Ex: Equipe de Campo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Descrição</Label>
              <Textarea
                id="group-description"
                value={currentGroup.description || ''}
                onChange={(e) =>
                  setCurrentGroup({
                    ...currentGroup,
                    description: e.target.value,
                  })
                }
                placeholder="Breve descrição da função do grupo..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Permissões do Sistema</Label>
              <div className="border rounded-lg p-4 bg-slate-50 max-h-[250px] overflow-y-auto">
                <div className="space-y-3">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = currentGroup.permissions?.includes(perm.id)
                    const isAllPermission = perm.id === 'all'
                    
                    return (
                      <div key={perm.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`perm-${perm.id}`}
                          checked={isChecked}
                          onCheckedChange={() => togglePermission(perm.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`perm-${perm.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {perm.label}
                          </label>
                          {isAllPermission && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Esta permissão concede acesso completo ao sistema
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                * A permissão "Acesso Total" substitui todas as outras permissões
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {currentGroup.id ? 'Salvar Alterações' : 'Criar Grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function UserGroupsPage() {
  return (
    <div className="space-y-6 pb-20">
      <UserGroupsManager />
    </div>
  )
}