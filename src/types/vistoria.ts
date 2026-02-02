// types/vistoria.ts
export interface Quadra {
  id: string;
  name: string;
  created_at: string;
}

export interface Lote {
  id: string;
  name: string;
  area: string;
  quadra_id: string;
  address?: string;
  status: 'pending' | 'surveyed' | 'approved' | 'rejected';
}

export interface Vistoria {
  id: string;
  lote_id: string;
  quadra_id: string;
  vistoriador_name: string;
  vistoriador_matricula: string;
  data_vistoria: string;
  horario_inicio: string;
  horario_termino: string;
  
  // Dados da propriedade
  proprietario_nome: string;
  proprietario_cpf: string;
  proprietario_telefone: string;
  proprietario_email: string;
  
  // Características do lote
  area_total: number;
  area_construida: number;
  tipo_construcao: 'alvenaria' | 'madeira' | 'mista' | 'outro';
  estado_conservacao: 'otimo' | 'bom' | 'regular' | 'ruim';
  ano_construcao?: number;
  
  // Infraestrutura
  possui_agua: boolean;
  possui_energia: boolean;
  possui_esgoto: boolean;
  possui_coleta_lixo: boolean;
  possui_pavimentacao: boolean;
  possui_iluminacao_publica: boolean;
  
  // Documentação
  possui_matricula: boolean;
  possui_escritura: boolean;
  possui_contrato_compra: boolean;
  possui_declaracao_posse: boolean;
  documentos_observacoes?: string;
  
  // Conflitos
  existe_conflito: boolean;
  tipo_conflito?: 'familiar' | 'vizinhanca' | 'sucessao' | 'outro';
  descricao_conflito?: string;
  
  // Observações
  observacoes_gerais?: string;
  recomendacoes?: string;
  
  // Assinaturas
  assinatura_proprietario_url?: string;
  assinatura_vistoriador_url?: string;
  
  // Mídia
  fotos_urls: string[];
  videos_urls?: string[];
  croqui_url?: string;
  
  // Status
  status: 'rascunho' | 'pendente' | 'aprovada' | 'rejeitada';
  created_at: string;
  updated_at: string;
}

export interface VistoriaFormData extends Omit<Vistoria, 'id' | 'created_at' | 'updated_at'> {
  quadra_id: string;
  lote_id: string;
}