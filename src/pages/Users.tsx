import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
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
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'

// Mock groups for UI selection (Roles)
const ROLES = [
  { id: 'admin', name: 'Administrador' },
  { id: 'manager', name: 'Gerente' },
  { id: 'viewer', name: 'Visualizador' },
]

export default function Users() {
  const { user, hasPermission } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch (e) {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  // Security Check
  if (!hasPermission('all') && !hasPermission('manage_users')) {
    return <Navigate to="/" replace />
  }

  const handleSave = async () => {
    if (!currentUser.username || !currentUser.name) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    try {
      await api.saveUser(currentUser)
      toast.success('Perfil atualizado com sucesso')
      setIsDialogOpen(false)
      loadData()
    } catch (e) {
      toast.error('Erro ao salvar usuário')
    }
  }

  const handleDelete = async (id: string) => {
    if (
      confirm(
        'Tem certeza que deseja remover este perfil? O acesso do usuário pode não ser revogado completamente sem Admin.',
      )
    ) {
      if (id === user?.id) {
        toast.error('Você não pode remover seu próprio perfil')
        return
      }
      try {
        await api.deleteUser(id)
        toast.success('Perfil removido')
        loadData()
      } catch (e) {
        toast.error('Erro ao remover perfil')
      }
    }
  }

  const openEdit = (u: User) => {
    setCurrentUser({ ...u })
    setIsDialogOpen(true)
  }

  const toggleRole = (roleId: string) => {
    // Allow only single role selection for simplicity in this implementation
    setCurrentUser({ ...currentUser, groupIds: [roleId] })
  }

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    )

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gerenciar Perfis
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie perfis e funções de usuários cadastrados.
          </p>
        </div>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email (Username)</TableHead>
              <TableHead>Função</TableHead>
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
                    {u.groupIds.map((gid) => (
                      <Badge
                        key={gid}
                        variant="outline"
                        className="text-xs uppercase"
                      >
                        {gid}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="default">Ativo</Badge>
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
                      disabled={u.id === user?.id}
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
            <DialogTitle>Editar Perfil</DialogTitle>
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
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={currentUser.username}
                  disabled // Email shouldn't be changed here without auth update
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Função (Role)</Label>
              <div className="border rounded-md p-3 space-y-2">
                {ROLES.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.id}
                      checked={currentUser.groupIds?.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <label
                      htmlFor={role.id}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
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
