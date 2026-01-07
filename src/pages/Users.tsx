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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Edit2, Loader2, ShieldAlert, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserGroupsManager } from './UserGroups'

const formSchema = z.object({
  name: z.string().min(1, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  username: z.string().min(1, 'Nome de usuário é obrigatório'),
  groups: z.array(z.string()).optional(),
  password: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function Users() {
  const { user, hasPermission } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      username: '',
      groups: [],
      password: '',
    },
  })

  useEffect(() => {
    loadData()
  }, [])

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
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
        <p className="text-gray-500 mt-2">
          Você não tem permissão para acessar esta página.
        </p>
        <Button className="mt-6" onClick={() => (window.location.href = '/')}>
          Voltar para o Dashboard
        </Button>
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
      const userData: Partial<User> & { email?: string; password?: string } = {
        id: editingUser?.id,
        name: values.name,
        username: values.username,
        email: values.email,
        password: values.password,
        groupIds: values.groups,
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
    form.reset({
      name: '',
      email: '',
      username: '',
      groups: [],
      password: '',
    })
    setIsDialogOpen(true)
  }

  const openEdit = (u: User) => {
    setEditingUser(u)
    form.reset({
      name: u.name,
      email: u.email || u.username,
      username: u.username,
      groups: u.groupIds || [],
      password: '',
    })
    setIsDialogOpen(true)
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
            Gestão de Acesso
          </h2>
          <p className="text-muted-foreground mt-1">
            Controle de usuários e grupos de permissão.
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="groups">Grupos de Acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="flex justify-end mb-4">
            <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Usuário
            </Button>
          </div>

          <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Username / Email</TableHead>
                  <TableHead>Grupos</TableHead>
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
                {users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <UserGroupsManager />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados e atribua os grupos de acesso.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="João Silva" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="joao@exemplo.com"
                          disabled={!!editingUser}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="joao.silva" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="groups"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupos de Acesso</FormLabel>
                    <div className="border rounded-md p-3">
                      <ScrollArea className="h-[150px]">
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
                                      <Checkbox
                                        checked={field.value?.includes(
                                          group.id,
                                        )}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                group.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== group.id,
                                                ),
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {group.name}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                          {availableGroups.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">
                              Nenhum grupo disponível.
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  Salvar Usuário
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
