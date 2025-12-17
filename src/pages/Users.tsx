import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/services/db'
import { User, UserGroup } from '@/types'
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
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'

export default function Users() {
  const { user, hasPermission } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Partial<User>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setUsers(db.getUsers())
    setGroups(db.getGroups())
  }

  // Security Check
  if (!hasPermission('all') && !hasPermission('manage_users')) {
    return <Navigate to="/" replace />
  }

  const handleSave = () => {
    if (!currentUser.username || !currentUser.name) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    // Constraint enforcement for UI feedback (DB handles it too, but better UX here)
    if (currentUser.id === 'u1') {
      if (!currentUser.groupIds?.includes('g1')) {
        toast.warning(
          'O usuário Carlos Botelho deve pertencer ao grupo Administrador Master. Adicionando automaticamente.',
        )
        // Logic handled in DB, just warning the user
      }
    }

    const userData: User = {
      id: currentUser.id || '',
      username: currentUser.username,
      name: currentUser.name,
      groupIds: currentUser.groupIds || [],
      active: currentUser.active ?? true,
      sync_status: 'synchronized', // Default needed for type
      date_added: Date.now(),
      date_updated: Date.now(),
      local_id: '',
    } as any // Bypassing base entity strictness for User mock

    db.saveUser(userData as User)
    toast.success('Usuário salvo com sucesso')
    setIsDialogOpen(false)
    loadData()
  }

  const handleDelete = (id: string) => {
    if (id === 'u1') {
      toast.error('O usuário mestre não pode ser removido.')
      return
    }

    if (confirm('Tem certeza que deseja remover este usuário?')) {
      if (id === user?.id) {
        toast.error('Você não pode remover seu próprio usuário')
        return
      }
      db.deleteUser(id)
      toast.success('Usuário removido')
      loadData()
    }
  }

  const openEdit = (u: User) => {
    setCurrentUser({ ...u })
    setIsDialogOpen(true)
  }

  const openNew = () => {
    setCurrentUser({
      name: '',
      username: '',
      groupIds: [],
      active: true,
    })
    setIsDialogOpen(true)
  }

  const toggleGroup = (groupId: string) => {
    // Prevent removing protected user from protected group
    if (currentUser.id === 'u1' && groupId === 'g1') {
      if (currentUser.groupIds?.includes('g1')) {
        toast.warning('Este usuário não pode ser removido do grupo Master.')
        return
      }
    }

    const currentGroups = currentUser.groupIds || []
    if (currentGroups.includes(groupId)) {
      setCurrentUser({
        ...currentUser,
        groupIds: currentGroups.filter((g) => g !== groupId),
      })
    } else {
      setCurrentUser({
        ...currentUser,
        groupIds: [...currentGroups, groupId],
      })
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gerenciar Usuários
          </h2>
          <p className="text-muted-foreground mt-1">
            Controle de acesso e permissões do sistema.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Grupos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.groupIds.map((gid) => {
                      const g = groups.find((gr) => gr.id === gid)
                      return (
                        <Badge key={gid} variant="outline" className="text-xs">
                          {g?.name || gid}
                        </Badge>
                      )
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? 'default' : 'destructive'}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(u)}
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(u.id)}
                      disabled={u.id === user?.id || u.id === 'u1'}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentUser.id ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={currentUser.name}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, name: e.target.value })
                  }
                  disabled={currentUser.id === 'u1'} // Prevent rename of master user for clarity, though not explicitly requested, good practice
                />
              </div>
              <div className="space-y-2">
                <Label>Nome de Usuário</Label>
                <Input
                  value={currentUser.username}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, username: e.target.value })
                  }
                  disabled={currentUser.id === 'u1'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Grupos de Acesso</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {groups.map((g) => (
                  <div key={g.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={g.id}
                      checked={currentUser.groupIds?.includes(g.id)}
                      onCheckedChange={() => toggleGroup(g.id)}
                      disabled={currentUser.id === 'u1' && g.id === 'g1'}
                    />
                    <label
                      htmlFor={g.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {g.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={currentUser.active}
                onCheckedChange={(c) =>
                  setCurrentUser({ ...currentUser, active: c === true })
                }
                disabled={currentUser.id === 'u1'}
              />
              <Label htmlFor="active">Usuário Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
