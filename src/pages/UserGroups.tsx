import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/services/db'
import { UserGroup, User } from '@/types'
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Edit2, Shield, Users as UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'

const AVAILABLE_PERMISSIONS = [
  { id: 'all', label: 'Acesso Total (Super Admin)' },
  { id: 'manage_users', label: 'Gerenciar Usuários' },
  { id: 'manage_groups', label: 'Gerenciar Grupos' },
  { id: 'edit_projects', label: 'Editar Projetos/Lotes' },
  { id: 'view_reports', label: 'Visualizar Relatórios' },
  { id: 'view_only', label: 'Apenas Visualização' },
]

export default function UserGroups() {
  const { hasPermission } = useAuth()
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<Partial<UserGroup>>({})
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setGroups(db.getGroups())
    setUsers(db.getUsers())
  }

  // Security Check
  if (!hasPermission('all') && !hasPermission('manage_groups')) {
    return <Navigate to="/" replace />
  }

  const handleSave = () => {
    if (!currentGroup.name || !currentGroup.role) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    // Force 'all' permission if 'all' is selected or if it's the Master group
    const permissions = currentGroup.permissions || []
    if (currentGroup.id === 'g1' && !permissions.includes('all')) {
      permissions.push('all')
    }

    const groupData: UserGroup = {
      id: currentGroup.id || '',
      name: currentGroup.name,
      role: currentGroup.role,
      permissions: permissions,
    }

    try {
      const savedGroup = db.saveGroup(groupData)
      db.updateGroupMembers(savedGroup.id, selectedMembers)
      toast.success('Grupo salvo com sucesso')
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar grupo')
    }
  }

  const handleDelete = (id: string) => {
    if (id === 'g1') {
      toast.error('O grupo Administrador Master não pode ser excluído.')
      return
    }

    if (
      confirm(
        'Tem certeza que deseja remover este grupo? Usuários associados serão removidos do grupo.',
      )
    ) {
      try {
        db.deleteGroup(id)
        toast.success('Grupo removido')
        loadData()
      } catch (error: any) {
        toast.error(error.message || 'Erro ao remover grupo')
      }
    }
  }

  const openEdit = (g: UserGroup) => {
    setCurrentGroup({ ...g })
    // Find users who have this group
    const members = users
      .filter((u) => u.groupIds.includes(g.id))
      .map((u) => u.id)
    setSelectedMembers(members)
    setIsDialogOpen(true)
  }

  const openNew = () => {
    setCurrentGroup({
      name: '',
      role: 'viewer',
      permissions: [],
    })
    setSelectedMembers([])
    setIsDialogOpen(true)
  }

  const togglePermission = (permId: string) => {
    const currentPerms = currentGroup.permissions || []
    if (currentPerms.includes(permId)) {
      // Prevent removing 'all' from g1
      if (currentGroup.id === 'g1' && permId === 'all') {
        toast.warning('Permissão total é obrigatória para este grupo.')
        return
      }
      setCurrentGroup({
        ...currentGroup,
        permissions: currentPerms.filter((p) => p !== permId),
      })
    } else {
      let newPerms = [...currentPerms, permId]
      if (permId === 'all') {
        newPerms = ['all'] // If all is selected, effectively user has all permissions
      } else if (newPerms.includes('all')) {
        // If adding specific permission but has all, no change needed conceptually, but lets keep it simple
      }
      setCurrentGroup({
        ...currentGroup,
        permissions: newPerms,
      })
    }
  }

  const toggleMember = (userId: string) => {
    // Prevent removing 'u1' from 'g1'
    if (currentGroup.id === 'g1' && userId === 'u1') {
      if (selectedMembers.includes(userId)) {
        toast.warning(
          'O usuário Carlos Botelho não pode ser removido deste grupo.',
        )
        return
      }
    }

    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId))
    } else {
      setSelectedMembers([...selectedMembers, userId])
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Grupos de Usuários
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie perfis, permissões e membros dos grupos.
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
              <TableHead>Nome do Grupo</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => {
              const memberCount = users.filter((u) =>
                u.groupIds.includes(g.id),
              ).length
              return (
                <TableRow key={g.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {g.id === 'g1' && (
                      <Shield className="w-4 h-4 text-primary" />
                    )}
                    {g.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {g.role}
                    </Badge>
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
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <UsersIcon className="w-3 h-3" /> {memberCount}
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
                        disabled={g.id === 'g1'}
                        title={
                          g.id === 'g1' ? 'Grupo protegido' : 'Excluir grupo'
                        }
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>
              {currentGroup.id ? 'Editar Grupo' : 'Novo Grupo'}
            </DialogTitle>
          </DialogHeader>

          <Tabs
            defaultValue="details"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6 pt-2">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="details">Detalhes & Permissões</TabsTrigger>
                <TabsTrigger value="members">
                  Membros ({selectedMembers.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent value="details" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Grupo</Label>
                    <Input
                      value={currentGroup.name}
                      onChange={(e) =>
                        setCurrentGroup({
                          ...currentGroup,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ex: Equipe de Campo"
                      disabled={currentGroup.id === 'g1'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Acesso</Label>
                    <Select
                      value={currentGroup.role}
                      onValueChange={(v: any) =>
                        setCurrentGroup({ ...currentGroup, role: v })
                      }
                      disabled={currentGroup.id === 'g1'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Permissões do Sistema</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-4 bg-slate-50">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const isDisabled =
                        currentGroup.id === 'g1' && perm.id === 'all'
                      const isChecked = currentGroup.permissions?.includes(
                        perm.id,
                      )

                      return (
                        <div
                          key={perm.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`perm-${perm.id}`}
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(perm.id)}
                            disabled={isDisabled}
                          />
                          <label
                            htmlFor={`perm-${perm.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {perm.label}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                  {currentGroup.permissions?.includes('all') && (
                    <p className="text-xs text-muted-foreground mt-2">
                      * A permissão "Acesso Total" sobrescreve todas as outras.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent
                value="members"
                className="mt-0 h-full flex flex-col"
              >
                <div className="mb-2">
                  <Label>Selecionar Usuários</Label>
                  <p className="text-xs text-muted-foreground">
                    Marque os usuários que farão parte deste grupo.
                  </p>
                </div>
                <div className="border rounded-md flex-1 overflow-hidden">
                  <ScrollArea className="h-[300px]">
                    <div className="divide-y">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`user-${u.id}`}
                              checked={selectedMembers.includes(u.id)}
                              onCheckedChange={() => toggleMember(u.id)}
                              disabled={
                                currentGroup.id === 'g1' && u.id === 'u1'
                              }
                            />
                            <div className="grid gap-0.5">
                              <label
                                htmlFor={`user-${u.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {u.name}
                              </label>
                              <span className="text-xs text-muted-foreground">
                                {u.username}
                              </span>
                            </div>
                          </div>
                          {u.active ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-green-600 border-green-200"
                            >
                              Ativo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-gray-400"
                            >
                              Inativo
                            </Badge>
                          )}
                        </div>
                      ))}
                      {users.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">
                          Nenhum usuário cadastrado.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t bg-gray-50 mt-auto">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Grupo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
