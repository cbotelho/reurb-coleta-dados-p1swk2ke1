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
import { Plus, Trash2, Edit2, Loader2, ShieldAlert, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const formSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  username: z.string().min(1, 'Nome de usuário é obrigatório'),
  photoUrl: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
  groups: z.array(z.string()).min(1, 'Selecione pelo menos um grupo'),
  password: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

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
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    photoUrl: '',
    status: 'active',
    groups: [],
    password: '',
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
      setUsers(usersData)
      setAvailableGroups(groupsData)
    } catch (e) {
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
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        email: values.email,
        password: values.password,
        photoUrl: values.photoUrl,
        status: values.status,
        groupIds: values.groups,
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
      console.error(error)
      toast.error(error.message || 'Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      if (id === user?.id) {
        toast.error('Você não pode remover seu próprio perfil')
        return
      }
      try {
        await api.deleteUser(id)
        toast.success('Usuário removido')
        loadData()
      } catch (e) {
        toast.error('Erro ao remover usuário')
      }
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
      firstName: u.firstName || u.name.split(' ')[0],
      lastName: u.lastName || u.name.split(' ').slice(1).join(' '),
      email: u.email || '',
      username: u.username,
      photoUrl: u.photoUrl || '',
      status: (u.status as 'active' | 'inactive' | 'suspended') || 'active',
      groups: u.groupIds || [],
      password: '',
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    )

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
              <TableHead>Grupo de Acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Login</TableHead>
              <TableHead>Criado Por</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.photoUrl} />
                    <AvatarFallback>
                      {u.firstName?.charAt(0) || u.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {u.firstName} {u.lastName}
                    </span>
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
                  <div className="flex flex-wrap gap-1">
                    {u.groupNames && u.groupNames.length > 0 ? (
                      u.groupNames.map((gName, idx) => (
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
                <TableCell className="text-sm">
                  {u.createdBy || 'Sistema'}
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
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum usuário encontrado.
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
                        <FormLabel>Foto de Perfil</FormLabel>
                        <div className="mt-2 flex flex-col items-center gap-2">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={field.value} />
                            <AvatarFallback className="text-2xl">
                              ?
                            </AvatarFallback>
                          </Avatar>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="URL da Imagem"
                              className="text-xs"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-2/3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="João" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Silva" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                            placeholder="joao@empresa.com"
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
                            <Input {...field} placeholder="joao.silva" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                              <FormField
                                key={group.id}
                                control={form.control}
                                name="groups"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={group.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={field.value?.includes(
                                              group.id,
                                            )}
                                            onChange={(e) => {
                                              const checked = e.target.checked
                                              const value = field.value || []
                                              if (checked) {
                                                field.onChange([
                                                  ...value,
                                                  group.id,
                                                ])
                                              } else {
                                                field.onChange(
                                                  value.filter(
                                                    (val) => val !== group.id,
                                                  ),
                                                )
                                              }
                                            }}
                                          />
                                          <FormLabel className="font-normal cursor-pointer text-sm">
                                            {group.name}
                                          </FormLabel>
                                        </div>
                                      </FormControl>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
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
                          <FormLabel>Senha Inicial</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="******"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {editingUser && (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-xs">
                      Para alterar a senha, peça ao usuário que utilize a função
                      "Esqueci minha senha" na tela de login.
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
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