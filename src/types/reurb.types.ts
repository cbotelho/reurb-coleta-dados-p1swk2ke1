// Tipos para o módulo REURB

/**
 * Tipos básicos
 */
export type ReurbTipo = 'individual' | 'coletivo';
export type ReurbFase = 'diagnostico' | 'projeto' | 'regularizacao';
export type StatusDocumento = 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise';
export type TipoPosse = 'posse_direta' | 'usucapiao' | 'concessao_uso' | 'convencao' | 'outros';
export type StatusProcesso = 'rascunho' | 'em_analise' | 'deferido' | 'indeferido' | 'em_recurso' | 'concluido';
export type TipoNotificacao = 'alerta' | 'atualizacao' | 'pendencia' | 'aprovacao' | 'sistema';

/**
 * Tipos para autenticação e autorização
 */
export type UserRole = 'Administrador' | 'Administradores' | 'tecnico' | 'gestor' | 'cidadão';

export interface ReurbProfile {
  id: string;
  grupo_acesso: string | null;
  nome_usuario: string | null;
  nome: string | null;
  sobrenome: string | null;
  email: string | null;
  foto: string | null;
  ultimo_login: string | null;
  situacao: string | null;
  criado_por: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  cpf?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  email: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  unread_notifications?: number;
}

export interface Permissao {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at?: string;
}

export interface RolePermissao {
  role: UserRole;
  permission_id: string;
  created_at: string;
}

/**
 * Tipos para documentos
 */
export interface DocumentoReurb {
  id: string;
  tipo_documento: string;
  numero: string;
  orgao_emissor: string;
  data_emissao: string;
  data_validade?: string;
  arquivo_url: string;
  status_validacao: StatusDocumento;
  observacoes?: string;
  created_by: string;
  validated_by?: string;
  validation_date?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Tipos para processos
 */
export interface ProcessoReurb {
  id: string;
  projeto_id: string;
  tipo_processo: 'regularizacao' | 'desapropriacao' | 'concessao' | 'outros';
  numero_processo: string;
  orgao_responsavel: string;
  status: StatusProcesso;
  data_abertura: string;
  data_conclusao?: string;
  responsavel_id?: string;
  descricao?: string;
  observacoes?: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Tipos para laudos técnicos
 */
export interface LaudoReurb {
  id: string;
  processo_id: string;
  tipo_laudo: 'tecnico' | 'ambiental' | 'juridico' | 'social' | 'outros';
  titulo: string;
  conteudo: string;
  anexos?: string[];
  responsavel_id: string;
  data_emissao: string;
  status: 'rascunho' | 'assinado' | 'publicado' | 'arquivado';
  assinatura_digital?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Tipos para notificações
 */
export interface NotificacaoReurb {
  id: string;
  usuario_id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_criacao: string;
  data_leitura?: string;
  acao_url?: string;
  metadata?: Record<string, any>;
}

/**
 * Tipos para projetos REURB
 */
export interface ReurbProject {
  id: string;
  nome: string;
  descricao?: string;
  tipo_reurb: ReurbTipo;
  fases_processo: ReurbFase[];
  data_limite_conclusao?: string;
  orgao_responsavel: string;
  status_legal: string;
  documentos_necessarios: string[];
  area_total?: number;
  numero_familias?: number;
  tipo_imovel?: 'urbano' | 'rural' | 'misto';
  observacoes?: string;
  endereco: {
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    coordenadas?: {
      latitude: number;
      longitude: number;
    };
  };
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Tipos para propriedades/lotes
 */
export interface ReurbProperty {
  id: string;
  projeto_id: string;
  numero_lote: string;
  tipo_posse: TipoPosse;
  situacao_fundiaria: string;
  documentos_comprobatorios: string[];
  historico_ocupacao?: string;
  restricoes_ambientais?: string[];
  situacao_cadastral: 'regular' | 'irregular' | 'em_regularizacao' | 'conflito';
  area_terreno: number;
  area_construida?: number;
  matricula_imobiliaria?: string;
  inscricao_imobiliaria?: string;
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
  endereco: {
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    referencia?: string;
  };
  proprietarios: Array<{
    id?: string;
    nome: string;
    cpf_cnpj: string;
    email?: string;
    telefone?: string;
    percentual?: number;
    representante_legal?: boolean;
  }>;
  observacoes?: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Tipos para quadras
 */
export interface ReurbQuadra {
  id: string;
  projeto_id: string;
  nome: string;
  descricao?: string;
  area_total: number;
  situacao_fundiaria: string;
  documentos: string[];
  coordenadas?: Array<{ latitude: number; longitude: number }>;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Tipos para contratos
 */
export interface ReurbContrato {
  id: string;
  projeto_id: string;
  tipo: 'convencao' | 'compra_venda' | 'cessao' | 'outros';
  numero: string;
  data_assinatura: string;
  data_registro?: string;
  cartorio_registro?: string;
  livro?: string;
  folha?: string;
  arquivo_url: string;
  partes: Array<{
    nome: string;
    cpf_cnpj: string;
    qualificacao: 'concedente' | 'concessionaria' | 'outros';
    representante_legal?: string;
    documento_representacao?: string;
  }>;
  observacoes?: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Tipos para auditoria
 */
export interface ReurbAuditLog {
  id: string;
  acao: string;
  tabela: string;
  registro_id: string;
  valores_antigos?: Record<string, any>;
  valores_novos?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  user_id: string;
  created_at: string;
}

/**
 * Tipos para formulários
 */
export type ReurbProjectFormData = Omit<ReurbProject, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by'>;
export type ReurbPropertyFormData = Omit<ReurbProperty, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by'>;
export type ReurbQuadraFormData = Omit<ReurbQuadra, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by'>;
export type ReurbContratoFormData = Omit<ReurbContrato, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by'>;

/**
 * Tipos para filtros e consultas
 */
export interface ProjectFilter {
  status?: string[];
  tipo?: ReurbTipo[];
  orgao_responsavel?: string[];
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Tipos para integrações externas
 */
export interface DadosCartorio {
  nome: string;
  cnpj: string;
  endereco: {
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  contato: {
    telefone: string;
    email: string;
    responsavel: string;
  };
  ato_credenciamento: string;
  data_credenciamento: string;
  ativo: boolean;
}

export interface DadosMatricula {
  numero: string;
  tipo: 'matricula' | 'transcricao' | 'avulsa';
  data_abertura: string;
  situacao: 'ativa' | 'cancelada' | 'suspensa' | 'baixada';
  proprietarios: Array<{
    nome: string;
    cpf_cnpj: string;
    tipo: 'titular' | 'procurador' | 'herdeiro';
  }>;
  endereco: {
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  area_terreno: number;
  area_construida?: number;
  matricula_imobiliaria: string;
  transcricoes?: Array<{
    numero: string;
    data: string;
    tipo: string;
    descricao: string;
  }>;
  onus?: Array<{
    tipo: string;
    descricao: string;
    data_inclusao: string;
    data_exclusao?: string;
  }>;
  atualizacao_cadastral?: string;
}

/**
 * Tipos para relatórios
 */
export interface RelatorioReurb {
  id: string;
  tipo: 'analitico' | 'sintetico' | 'personalizado';
  titulo: string;
  descricao?: string;
  parametros: Record<string, any>;
  formato: 'pdf' | 'xlsx' | 'csv';
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  arquivo_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Tipos para configurações do sistema
 */
export interface ConfiguracaoSistema {
  id: string;
  chave: string;
  valor: any;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  descricao?: string;
  opcoes?: Array<{ valor: string; label: string }>;
  categoria: string;
  editavel: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

/**
 * Tipos para templates de documentos
 */
export interface ModeloDocumento {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'contrato' | 'oficio' | 'declaracao' | 'laudo' | 'outros';
  conteudo: string;
  variaveis: Array<{
    nome: string;
    descricao: string;
    obrigatorio: boolean;
    tipo: 'texto' | 'numero' | 'data' | 'lista' | 'booleano';
    opcoes?: Array<{ valor: string; label: string }>;
  }>;
  ativo: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}
