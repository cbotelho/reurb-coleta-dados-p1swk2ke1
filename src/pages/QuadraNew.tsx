import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/services/api'
import { Quadra } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

const formSchema = z.object({
  name: z.string().min(1, 'Nome da quadra é obrigatório'),
  area: z.string().optional(),
  description: z.string().optional(),
  document_url: z.string().optional(),
  image_url: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function QuadraNew() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [saving, setSaving] = useState(false)

  const canEditProjects = hasPermission('all') || hasPermission('edit_projects')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      area: '',
      description: '',
      document_url: '',
      image_url: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    if (!projectId || !canEditProjects) return

    setSaving(true)
    try {
      const newQuadra = await api.createQuadra({
        ...values,
        project_id: projectId,
      })
      toast.success('Quadra criada com sucesso!')
      navigate(`/quadras/${newQuadra.local_id}`)
    } catch (error) {
      console.error('Error creating quadra:', error)
      toast.error('Erro ao criar quadra.')
    } finally {
      setSaving(false)
    }
  }

  if (!canEditProjects) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-500">
            Você não tem permissão para criar quadras.
          </p>
          <Button asChild className="mt-4">
            <Link to="/projetos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Projetos
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline">
          <Link to={`/projetos/${projectId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Quadra</h1>
          <p className="text-muted-foreground">
            Adicionar nova quadra ao projeto
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Quadra</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Quadra *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da quadra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área</FormLabel>
                      <FormControl>
                        <Input placeholder="Área da quadra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memorial Descritivo</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Memorial descritivo da quadra" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="document_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Documento</FormLabel>
                      <FormControl>
                        <Input placeholder="https://exemplo.com/documento.pdf" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link to={`/projetos/${projectId}`}>Cancelar</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Criar Quadra
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
