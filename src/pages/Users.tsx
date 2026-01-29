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
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Trash2, Edit2, Loader2, ShieldAlert, Search, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const formSchema = z.object({
  fullName: z.string().min(1, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  username: z.string().min(1, 'Nome de usuário é obrigatório'),
  photoUrl: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
  groups: z.array(z.string()).min(1, 'Selecione pelo menos um grupo'),
  password: z.string().optional(),
  role: z.string().optional(),
})

type FormValues = {
  fullName: string
  email: string
  username: string
  photoUrl?: string
  status: 'active' | 'inactive' | 'suspended'
  groups: string[]
  password?: string
  role?: string
}

export default function Users() {
  const { user, hasPermission } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const defaultValues: FormValues = {
    fullName: '',
    email: '',
    username: '',
    photoUrl: '',
    status: 'active',
    groups: [],
    password: '',
    role: 'vistoriador',
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users)
    } else {
      const lower = searchTerm.toLowerCase()
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name.toLowerCase().includes(lower) ||
            u.username.toLowerCase().includes(lower) ||
            u.email?.toLowerCase().includes(lower),
        ),
      )
    }
  }, [searchTerm, users])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, groupsData] = await Promise.all([
        api.getUsers(),
        api.getGroups(),
      ])
      
      if (Array.isArray(usersData)) {
        setUsers(usersData)
      } else {
        console.error('Resposta inválida para usuários:', usersData)
        toast.error('Formato de resposta inválido para usuários')
        setUsers([])
      }
      
      if (Array.isArray(groupsData)) {
        setAvailableGroups(groupsData)
      } else {
        console.error('Resposta inválida para grupos:', groupsData)
        toast.error('Formato de resposta inválido para grupos')
        setAvailableGroups([])
      }
    } catch (e: any) {
      console.error('Erro ao carregar dados:', e)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Security Check (RBAC)
  if (!hasPermission('all') && !hasPermission('manage_users')) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
        <p className="text-gray-500 mt-2">
          Você não tem permissão para gerenciar usuários.
        </p>
      </div>
    )
  }

  const onSubmit = async (values: FormValues) => {
    // If creating, password is required
    if (!editingUser && (!values.password || values.password.length < 6)) {
      form.setError('password', {
        message: 'Senha deve ter no mínimo 6 caracteres',
      })
      return
    }

    setSaving(true)
    try {
      const userData = {
        id: editingUser?.id,
        fullName: values.fullName.trim(),
        username: values.username.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        password: values.password || undefined,
        photoUrl: values.photoUrl?.trim() || undefined,
        status: values.status,
        groupIds: values.groups,
        role: values.role || 'vistoriador',
        createdById: user?.id,
      }

      await api.saveUser(userData)

      toast.success(
        editingUser
          ? 'Usuário atualizado com sucesso'
          : 'Usuário criado com sucesso',
      )
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      toast.error(error.message || 'Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) {
      return
    }
    
    if (id === user?.id) {
      toast.error('Você não pode remover seu próprio perfil')
      return
    }
    
    try {
      await api.deleteUser(id)
      toast.success('Usuário removido com sucesso')
      loadData()
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error)
      toast.error('Erro ao remover usuário')
    }
  }

  const openNew = () => {
    setEditingUser(null)
    form.reset(defaultValues)
    setIsDialogOpen(true)
  }

  const openEdit = (u: User) => {
    setEditingUser(u)
    form.reset({
      fullName: u.name || '',
      email: u.email || '',
      username: u.username,
      photoUrl: u.photoUrl || '',
      status: (u.status as 'active' | 'inactive' | 'suspended') || 'active',
      groups: u.groupIds || [],
      password: '',
      role: (u as any).role || 'vistoriador',
    })
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
            Ativo
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
            Inativo
          </Badge>
        )
      case 'suspended':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0">
            Suspenso
          </Badge>
        )
      default:
        return <Badge variant="outline">{status || 'Desconhecido'}</Badge>
    }
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
            Admin
          </Badge>
        )
      case 'vistoriador':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
            Vistoriador
          </Badge>
        )
      default:
        return <Badge variant="outline">{role || 'Usuário'}</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch (e) {
      console.error('Erro ao formatar data:', e)
      return '-'
    }
  }

  // Função para gerar avatar inicial
  const getAvatarInitials = (fullName?: string, username?: string) => {
    if (fullName) {
      const nameParts = fullName.split(' ')
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase()
      }
      return fullName.charAt(0).toUpperCase()
    } else if (username) {
      return username.charAt(0).toUpperCase()
    }
    return '?'
  }

  // Função para obter nomes dos grupos
  const getGroupNames = (user: User): string[] => {
    if (user.groupNames && user.groupNames.length > 0) {
      return user.groupNames
    }
    
    // Se não tiver groupNames, tenta mapear groupIds para nomes
    if (user.groupIds && user.groupIds.length > 0) {
      return user.groupIds.map(groupId => {
        const group = availableGroups.find(g => g.id === groupId)
        return group ? group.name : 'Desconhecido'
      })
    }
    
    return []
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 h-8 w-8 mb-4" />
        <p className="text-muted-foreground">Carregando usuários...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gestão de Usuários
          </h2>
          <p className="text-muted-foreground mt-1">
            Controle avançado de perfis e grupos de acesso.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar usuários..."
              className="pl-9 w-[200px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Foto</TableHead>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Email / Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Grupo de Acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Login</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => {
              const groupNames = getGroupNames(u)
              const userRole = (u as any).role || 'vistoriador'
              
              return (
                <TableRow key={u.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.photoUrl || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getAvatarInitials(u.name, u.username)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ID: {u.id.substring(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{u.email}</span>
                      <span className="text-xs text-muted-foreground">
                        @{u.username}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(userRole)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {groupNames.length > 0 ? (
                        groupNames.map((gName, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {gName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          Sem grupo
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(u.status)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(u.lastLoginAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(u)}
                        title="Editar usuário"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === user?.id}
                        title={u.id === user?.id ? "Você não pode remover seu próprio perfil" : "Remover usuário"}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center">
                    <UserIcon className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="font-medium">Nenhum usuário encontrado</p>
                    <p className="text-sm mt-1">
                      {searchTerm ? 'Tente alterar sua busca' : 'Crie seu primeiro usuário clicando em "Novo Usuário"'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes do perfil e configure o acesso.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <div className="flex gap-4">
                <div className="w-1/3">
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem className="text-center">
                        <FormLabel>Foto de Perfil (Opcional)</FormLabel>
                        <div className="mt-2 flex flex-col items-center gap-2">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={field.value || undefined} />
                            <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                              {getAvatarInitials(
                                form.getValues('fullName'),
                                form.getValues('username')
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <FormControl>
                            <div className="w-full">
                              <Input
                                {...field}
                                value={field.value || ''}
                                placeholder="URL da Imagem"
                                className="text-xs"
                              />
                              <p className="text-xs text-muted-foreground mt-1 text-center">
                                Deixe em branco para usar avatar padrão
                              </p>
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-2/3 space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Carlos Botelho" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="carlos@empresa.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="carlos.botelho" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="vistoriador">Vistoriador</SelectItem>
                              <SelectItem value="gestor">Gestor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="suspended">
                              Suspenso
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="groups"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupos de Acesso *</FormLabel>
                      <div className="border rounded-md p-3 h-[150px]">
                        <ScrollArea className="h-full">
                          <div className="space-y-2">
                            {availableGroups.map((group) => (
                              <div
                                key={group.id}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`group-${group.id}`}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={field.value?.includes(group.id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    const value = field.value || []
                                    if (checked) {
                                      field.onChange([...value, group.id])
                                    } else {
                                      field.onChange(
                                        value.filter((val) => val !== group.id)
                                      )
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`group-${group.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {group.name}
                                </label>
                              </div>
                            ))}
                            {availableGroups.length === 0 && (
                              <p className="text-sm text-muted-foreground italic">
                                Nenhum grupo disponível. Crie grupos primeiro.
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  {!editingUser && (
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Inicial *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Mínimo 6 caracteres"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {editingUser && (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-xs">
                      <p className="font-medium mb-1">Alteração de Senha</p>
                      <p>Para alterar a senha, peça ao usuário que utilize a função "Esqueci minha senha" na tela de login.</p>
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-xs">
                    <p className="font-medium mb-1">Informações Importantes</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Foto de perfil é opcional</li>
                      <li>O email será usado para login</li>
                      <li>Username deve ser único</li>
                      <li>Role define o nível de acesso principal</li>
                    </ul>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}