import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { ReurbProject, ReurbTipo, ReurbFase } from '@/types/reurb.types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Calendar,
  FileText,
  MapPin,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function ReurbProjectList() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 9;

  // Buscar projetos REURB
  const {
    data: paginatedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reurb-projects', { page, pageSize }],
    queryFn: () =>
      api.get(`/reurb/projects?page=${page}&pageSize=${pageSize}`).then((res) => res.data),
    keepPreviousData: true,
  });

  // Mutação para deletar um projeto
  const deleteProject = useMutation({
    mutationFn: (id: string) => api.delete(`/reurb/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reurb-projects'] });
      toast.success('Projeto excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir projeto:', error);
      toast.error('Erro ao excluir o projeto. Tente novamente.');
    },
  });

  const handleDeleteProject = (project: ReurbProject) => {
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${project.nome}"?`)) {
      deleteProject.mutate(project.id);
    }
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'suspenso':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter o ícone de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <Clock className="w-4 h-4 mr-1" />;
      case 'em_andamento':
        return <Loader2 className="w-4 h-4 mr-1 animate-spin" />;
      case 'concluido':
        return <CheckCircle2 className="w-4 h-4 mr-1" />;
      case 'suspenso':
        return <XCircle className="w-4 h-4 mr-1" />;
      default:
        return <AlertCircle className="w-4 h-4 mr-1" />;
    }
  };

  // Função para formatar o tipo do projeto
  const formatTipoReurb = (tipo: ReurbTipo) => {
    return tipo === 'individual' ? 'Individual' : 'Coletivo';
  };

  // Função para formatar as fases do processo
  const formatFasesProcesso = (fases: ReurbFase[]) => {
    return fases
      .map((fase) => {
        switch (fase) {
          case 'diagnostico':
            return 'Diagnóstico';
          case 'projeto':
            return 'Projeto';
          case 'regularizacao':
            return 'Regularização';
          default:
            return fase;
        }
      })
      .join(' • ');
  };

  if (isLoading && !paginatedData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>Erro ao carregar os projetos. Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  const { data: projects = [], total = 0 } = paginatedData || {};
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Projetos REURB ({total || 0})
          </h2>
          <p className="text-muted-foreground text-sm">
            Gerencie os projetos de regularização fundiária urbana.
          </p>
        </div>
        {hasPermission('criar_projetos') && (
          <Button asChild>
            <Link to="/reurb/projetos/novo">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: ReurbProject) => (
          <Card
            key={project.id}
            className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{project.nome}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {getStatusIcon(project.status)}
                      {project.status === 'rascunho' && 'Rascunho'}
                      {project.status === 'em_andamento' && 'Em Andamento'}
                      {project.status === 'concluido' && 'Concluído'}
                      {project.status === 'suspenso' && 'Suspenso'}
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">
                      {formatTipoReurb(project.tipo_reurb)}
                    </Badge>
                  </div>
                </div>
                {hasPermission('editar_projetos') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/reurb/projetos/${project.id}/editar`} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => handleDeleteProject(project)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <div className="space-y-3">
                {project.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.descricao}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground line-clamp-2">
                      {project.endereco.logradouro}
                      {project.endereco.numero && `, ${project.endereco.numero}`}
                      {project.endereco.complemento && ` - ${project.endereco.complemento}`}
                      {project.endereco.bairro && `, ${project.endereco.bairro}`}
                      {project.endereco.cidade && `, ${project.endereco.cidade} - ${project.endereco.estado}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Criado em {format(new Date(project.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {project.fases_processo.length > 0 && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">
                        {formatFasesProcesso(project.fases_processo)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t bg-muted/20">
              <Button asChild variant="outline" className="w-full">
                <Link to={`/reurb/projetos/${project.id}`}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((old) => Math.max(old - 1, 1))}
            disabled={page === 1 || isLoading}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((old) => old + 1)}
            disabled={page >= totalPages || isLoading}
          >
            Próxima
          </Button>
        </div>
      )}

      {projects.length === 0 && !isLoading && (
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium text-muted-foreground">Nenhum projeto encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {hasPermission('criar_projetos') 
              ? 'Comece criando um novo projeto.'
              : 'Nenhum projeto foi cadastrado ainda.'}
          </p>
          {hasPermission('criar_projetos') && (
            <Button asChild className="mt-4">
              <Link to="/reurb/projetos/novo">
                <Plus className="w-4 h-4 mr-2" />
                Criar Projeto
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
