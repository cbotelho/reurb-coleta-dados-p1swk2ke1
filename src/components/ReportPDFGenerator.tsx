// components/ReportPDFGenerator.tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, FileText, Home, MapPin, User, Calendar, CheckCircle, ChevronDown, Eye, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Quadra {
  id: string;
  name: string;
  created_at: string;
}

interface Lote {
  id: string;
  quadra_id: string;
  name: string;
  area: string;
  address: string;
  status: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

interface Vistoria {
  id: string;
  property_id: string;
  quadra_id?: string;
  vistoriador_name: string;
  vistoriador_matricula: string;
  data_vistoria: string;
  proprietario_nome: string;
  proprietario_cpf: string;
  proprietario_telefone: string;
  tipo_construcao: string;
  estado_conservacao: string;
  possui_agua: boolean;
  possui_energia: boolean;
  possui_esgoto: boolean;
  possui_pavimentacao: boolean;
  possui_iluminacao_publica: boolean;
  observacoes: string;
  fotos_urls: string[];
  status: string;
  created_at: string;
}

const ReportPDFGenerator: React.FC = () => {
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedVistoria, setSelectedVistoria] = useState<Vistoria | null>(null);

  // Configurações do Supabase
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mbcstctoikcnicmeyjgh.supabase.co';
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Headers para API
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  // Carregar todas as quadras
  const loadQuadras = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/reurb_quadras?select=id,name,area,description&order=name.asc`, {
        headers,
      });
      const data = await response.json();
      setQuadras(data);
    } catch (error) {
      console.error('Erro ao carregar quadras:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar todas as vistorias
  const loadVistorias = async (filters = {}) => {
    try {
      setLoading(true);
      
      // Construir query com filtros
      let query = `${SUPABASE_URL}/rest/v1/reurb_surveys?select=id,property_id,created_at,updated_at,applicant_name,applicant_cpf,city,state,residents_count,has_children,form_number,survey_date,occupation_time,acquisition_mode,property_use,construction_type,roof_type,floor_type,rooms_count,conservation_state,fencing,water_supply,energy_supply,sanitation,street_paving,observations,surveyor_name,surveyor_signature,assinatura_requerente,analise_ia_classificacao,analise_ia_parecer,analise_ia_proximo_passo,analise_ia_gerada_em,documents`;
      
      const queryParams = [];
      if (statusFilter) {
        queryParams.push(`status=eq.${statusFilter}`);
      }
      if (dateFilter.start) {
        queryParams.push(`created_at=gte.${dateFilter.start}`);
      }
      if (dateFilter.end) {
        queryParams.push(`created_at=lte.${dateFilter.end}`);
      }
      if (searchTerm) {
        queryParams.push(`or=(vistoriador_name.ilike.%${searchTerm}%,proprietario_nome.ilike.%${searchTerm}%)`);
      }
      
      if (queryParams.length > 0) {
        query += `&${queryParams.join('&')}`;
      }
      
      query += `&order=created_at.desc`;

      const response = await fetch(query, { headers });
      const data = await response.json();
      setVistorias(data);

      // Carregar lotes relacionados
      if (data.length > 0) {
        const propertyIds = data.map(v => v.property_id).filter(id => id);
        if (propertyIds.length > 0) {
          await loadLotesByIds(propertyIds);
        }
      }

    } catch (error) {
      console.error('Erro ao carregar vistorias:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar lotes por IDs
  const loadLotesByIds = async (ids: string[]) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/reurb_properties?id=in.(${ids.join(',')})&select=id,name,address,area,description,latitude,longitude,status`,
        { headers }
      );
      const data = await response.json();
      setLotes(data);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    }
  };

  // Inicializar
  useEffect(() => {
    loadQuadras();
    loadVistorias();
  }, []);

  // Gerar PDF individual
  const generateSinglePDF = (vistoria: Vistoria) => {
    const lote = lotes.find(l => l.id === vistoria.property_id);
    const quadra = quadras.find(q => q.id === lote?.quadra_id || vistoria.quadra_id);

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Configurações
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Cabeçalho
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO DE VISTORIA TÉCNICA', pageWidth / 2, yPos, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos += 10;
    pdf.text('SISTEMA REURB - GOVERNO DO ESTADO DO AMAPÁ', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Tabela de informações básicas
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('1. IDENTIFICAÇÃO DO IMÓVEL', margin, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const basicInfo = [
      ['Quadra:', quadra?.name || 'Não informada'],
      ['Lote:', lote?.name || 'Não informado'],
      ['Área:', `${lote?.area || '0'} m²`],
      ['Endereço:', lote?.address || 'Não informado'],
      ['Status do lote:', lote?.status || 'Não informado'],
    ];

    basicInfo.forEach(([label, value]) => {
      pdf.text(label, margin, yPos);
      pdf.text(value, margin + 40, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Dados da vistoria
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. DADOS DA VISTORIA', margin, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const vistoriaInfo = [
      ['Data:', new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR')],
      ['Vistoriador:', vistoria.vistoriador_name],
      ['Matrícula:', vistoria.vistoriador_matricula],
      ['Status:', vistoria.status],
    ];

    vistoriaInfo.forEach(([label, value]) => {
      pdf.text(label, margin, yPos);
      pdf.text(value, margin + 40, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Proprietário
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. PROPRIETÁRIO/POSSUIDOR', margin, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const ownerInfo = [
      ['Nome:', vistoria.proprietario_nome],
      ['CPF:', vistoria.proprietario_cpf],
      ['Telefone:', vistoria.proprietario_telefone || 'Não informado'],
    ];

    ownerInfo.forEach(([label, value]) => {
      pdf.text(label, margin, yPos);
      pdf.text(value, margin + 40, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Características
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('4. CARACTERÍSTICAS DA CONSTRUÇÃO', margin, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const characteristics = [
      ['Tipo de Construção:', vistoria.tipo_construcao || 'Não informado'],
      ['Estado de Conservação:', vistoria.estado_conservacao || 'Não informado'],
    ];

    characteristics.forEach(([label, value]) => {
      pdf.text(label, margin, yPos);
      pdf.text(value, margin + 60, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Infraestrutura
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('5. INFRAESTRUTURA DISPONÍVEL', margin, yPos);
    yPos += 10;

    const infrastructure = [
      ['Água encanada', vistoria.possui_agua],
      ['Energia elétrica', vistoria.possui_energia],
      ['Rede de esgoto', vistoria.possui_esgoto],
      ['Pavimentação', vistoria.possui_pavimentacao],
      ['Iluminação pública', vistoria.possui_iluminacao_publica],
    ];

    pdf.setFontSize(10);
    let col1Y = yPos;
    let col2Y = yPos;
    
    infrastructure.forEach(([item, has], index) => {
      const y = index < 3 ? col1Y : col2Y;
      const x = index < 3 ? margin : margin + 80;
      
      pdf.text(`${has ? '✓' : '✗'} ${item}`, x, y);
      
      if (index < 3) col1Y += 6;
      else col2Y += 6;
    });

    yPos = Math.max(col1Y, col2Y) + 5;

    // Observações
    if (vistoria.observacoes) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('6. OBSERVAÇÕES', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const observations = pdf.splitTextToSize(vistoria.observacoes, pageWidth - (2 * margin));
      pdf.text(observations, margin, yPos);
      yPos += observations.length * 5 + 5;
    }

    // Fotos (se houver)
    if (vistoria.fotos_urls && vistoria.fotos_urls.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('7. FOTOS DA VISTORIA', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total de fotos: ${vistoria.fotos_urls.length}`, margin, yPos);
      yPos += 10;

      // Listar URLs das fotos
      vistoria.fotos_urls.forEach((url, index) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(`${index + 1}. ${url}`, margin, yPos);
        yPos += 6;
      });
    }

    // Assinaturas
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('8. ASSINATURAS', margin, yPos);
    yPos += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Linha para assinatura do proprietário
    pdf.text('________________________________________', margin, yPos);
    pdf.text('Proprietário/Possuidor', margin + 20, yPos + 8);
    pdf.text(vistoria.proprietario_nome, margin, yPos + 16);
    pdf.text(`CPF: ${vistoria.proprietario_cpf}`, margin, yPos + 22);

    // Linha para assinatura do vistoriador
    pdf.text('________________________________________', margin + 100, yPos);
    pdf.text('Vistoriador Técnico', margin + 120, yPos + 8);
    pdf.text(vistoria.vistoriador_name, margin + 100, yPos + 16);
    pdf.text(`Matrícula: ${vistoria.vistoriador_matricula}`, margin + 100, yPos + 22);

    yPos += 40;

    // Rodapé
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
    pdf.text('Sistema REURB - Prefeitura Municipal', pageWidth / 2, yPos + 5, { align: 'center' });
    pdf.text(`ID da vistoria: ${vistoria.id.substring(0, 8)}...`, pageWidth / 2, yPos + 10, { align: 'center' });

    // Salvar PDF
    const fileName = `VISTORIA_${quadra?.name || 'Q'}_${lote?.name || 'L'}_${vistoria.vistoriador_name.replace(/\s+/g, '_')}_${new Date(vistoria.data_vistoria).toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  // Gerar PDF para múltiplas vistorias
  const generateBulkPDF = (selectedVistorias: Vistoria[]) => {
    if (selectedVistorias.length === 0) {
      alert('Selecione pelo menos uma vistoria para gerar os relatórios.');
      return;
    }

    selectedVistorias.forEach((vistoria, index) => {
      // Adicionar pequeno delay para não sobrecarregar
      setTimeout(() => {
        generateSinglePDF(vistoria);
      }, index * 500);
    });

    alert(`${selectedVistorias.length} relatórios serão gerados em sequência.`);
  };

  // Gerar relatório consolidado
  const generateConsolidatedReport = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Cabeçalho
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO CONSOLIDADO DE VISTORIAS', 105, 20, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('SISTEMA REURB - PREFEITURA MUNICIPAL', 105, 27, { align: 'center' });
    pdf.text(`Período: ${dateFilter.start || 'Início'} até ${dateFilter.end || 'Fim'}`, 105, 34, { align: 'center' });
    pdf.text(`Total de vistorias: ${vistorias.length}`, 105, 41, { align: 'center' });

    // Tabela com autotable
    const tableData = vistorias.map((v, index) => {
      const lote = lotes.find(l => l.id === v.property_id);
      const quadra = quadras.find(q => q.id === lote?.quadra_id);
      
      return [
        index + 1,
        quadra?.name || '-',
        lote?.name || '-',
        v.vistoriador_name,
        new Date(v.data_vistoria).toLocaleDateString('pt-BR'),
        v.proprietario_nome,
        v.status
      ];
    });

    (pdf as any).autoTable({
      startY: 50,
      head: [['#', 'Quadra', 'Lote', 'Vistoriador', 'Data', 'Proprietário', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204] },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });

    // Estatísticas
    const statsY = (pdf as any).lastAutoTable.finalY + 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ESTATÍSTICAS', 20, statsY);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const stats = [
      ['Total de vistorias:', vistorias.length.toString()],
      ['Vistorias concluídas:', vistorias.filter(v => v.status === 'completed').length.toString()],
      ['Vistorias pendentes:', vistorias.filter(v => v.status === 'pending').length.toString()],
      ['Com água:', vistorias.filter(v => v.possui_agua).length.toString()],
      ['Com energia:', vistorias.filter(v => v.possui_energia).length.toString()],
      ['Com esgoto:', vistorias.filter(v => v.possui_esgoto).length.toString()],
    ];

    let y = statsY + 10;
    stats.forEach(([label, value]) => {
      pdf.text(label, 20, y);
      pdf.text(value, 80, y);
      y += 6;
    });

    // Rodapé
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 280, { align: 'center' });
    pdf.text('Sistema REURB - Relatório Consolidado', 105, 285, { align: 'center' });

    pdf.save(`RELATORIO_CONSOLIDADO_VISTORIAS_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Filtrar vistorias
  const filteredVistorias = vistorias.filter(vistoria => {
    const lote = lotes.find(l => l.id === vistoria.property_id);
    const quadra = quadras.find(q => q.id === lote?.quadra_id);
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        vistoria.vistoriador_name.toLowerCase().includes(searchLower) ||
        vistoria.proprietario_nome.toLowerCase().includes(searchLower) ||
        (lote?.name.toLowerCase().includes(searchLower) || false) ||
        (quadra?.name.toLowerCase().includes(searchLower) || false)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Gerador de Relatórios PDF</h1>
                <p className="text-gray-600">Gere relatórios das vistorias já cadastradas</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: {vistorias.length} vistorias
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar vistoriador, proprietário, lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="completed">Concluída</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovada</option>
              <option value="rejected">Rejeitada</option>
            </select>

            {/* Data inicial */}
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Data inicial"
            />

            {/* Data final */}
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Data final"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadVistorias()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              disabled={loading}
            >
              <Filter className="w-4 h-4" />
              Aplicar Filtros
            </button>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setDateFilter({ start: '', end: '' });
                loadVistorias();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Limpar Filtros
            </button>

            <button
              onClick={generateConsolidatedReport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              disabled={vistorias.length === 0}
            >
              <FileDown className="w-4 h-4" />
              Relatório Consolidado
            </button>
          </div>
        </div>

        {/* Lista de Vistorias */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando vistorias...</p>
            </div>
          ) : filteredVistorias.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma vistoria encontrada</p>
              <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">{filteredVistorias.length} vistorias encontradas</span>
                  </div>
                  <button
                    onClick={() => generateBulkPDF(filteredVistorias)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Gerar Todos ({filteredVistorias.length})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quadra/Lote
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vistoriador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proprietário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVistorias.map((vistoria) => {
                      const lote = lotes.find(l => l.id === vistoria.property_id);
                      const quadra = quadras.find(q => q.id === lote?.quadra_id);

                      return (
                        <tr key={vistoria.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Home className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {quadra?.name || 'Quadra N/A'} / {lote?.name || 'Lote N/A'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {lote?.area || '0'} m²
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vistoria.vistoriador_name}</div>
                            <div className="text-sm text-gray-500">{vistoria.vistoriador_matricula}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vistoria.proprietario_nome}</div>
                            <div className="text-sm text-gray-500">{vistoria.proprietario_cpf}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(vistoria.data_vistoria).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(vistoria.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vistoria.status === 'completed' ? 'bg-green-100 text-green-800' :
                              vistoria.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              vistoria.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {vistoria.status === 'completed' ? 'Concluída' :
                               vistoria.status === 'pending' ? 'Pendente' :
                               vistoria.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedVistoria(vistoria)}
                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg"
                                title="Visualizar detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => generateSinglePDF(vistoria)}
                                className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg"
                                title="Gerar PDF"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => generateSinglePDF(vistoria)}
                                className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded-lg"
                                title="Baixar PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Modal de detalhes */}
        {selectedVistoria && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Detalhes da Vistoria</h2>
                  <p className="text-gray-600">
                    {lotes.find(l => l.id === selectedVistoria.property_id)?.name} - 
                    {quadras.find(q => q.id === lotes.find(l => l.id === selectedVistoria.property_id)?.quadra_id)?.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVistoria(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-700 mb-2">Informações do Imóvel</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {(() => {
                          const lote = lotes.find(l => l.id === selectedVistoria.property_id);
                          const quadra = quadras.find(q => q.id === lote?.quadra_id);
                          
                          return (
                            <>
                              <p><strong>Quadra:</strong> {quadra?.name}</p>
                              <p><strong>Lote:</strong> {lote?.name}</p>
                              <p><strong>Área:</strong> {lote?.area} m²</p>
                              <p><strong>Endereço:</strong> {lote?.address}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-700 mb-2">Proprietário</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p><strong>Nome:</strong> {selectedVistoria.proprietario_nome}</p>
                        <p><strong>CPF:</strong> {selectedVistoria.proprietario_cpf}</p>
                        <p><strong>Telefone:</strong> {selectedVistoria.proprietario_telefone || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-700 mb-2">Dados da Vistoria</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p><strong>Vistoriador:</strong> {selectedVistoria.vistoriador_name}</p>
                        <p><strong>Matrícula:</strong> {selectedVistoria.vistoriador_matricula}</p>
                        <p><strong>Data:</strong> {new Date(selectedVistoria.data_vistoria).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            selectedVistoria.status === 'completed' ? 'bg-green-100 text-green-800' :
                            selectedVistoria.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {selectedVistoria.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-700 mb-2">Características</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p><strong>Tipo de construção:</strong> {selectedVistoria.tipo_construcao || 'Não informado'}</p>
                        <p><strong>Estado de conservação:</strong> {selectedVistoria.estado_conservacao || 'Não informado'}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-700 mb-2">Infraestrutura</h3>
                      <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedVistoria.possui_agua ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>Água encanada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedVistoria.possui_energia ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>Energia elétrica</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedVistoria.possui_esgoto ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>Rede de esgoto</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedVistoria.possui_pavimentacao ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>Pavimentação</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${selectedVistoria.possui_iluminacao_publica ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>Iluminação pública</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedVistoria.observacoes && (
                  <div className="mt-6">
                    <h3 className="font-bold text-gray-700 mb-2">Observações</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p>{selectedVistoria.observacoes}</p>
                    </div>
                  </div>
                )}

                {selectedVistoria.fotos_urls && selectedVistoria.fotos_urls.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-bold text-gray-700 mb-2">Fotos ({selectedVistoria.fotos_urls.length})</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {selectedVistoria.fotos_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={url}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg hover:opacity-90 transition-opacity"
                          />
                          <p className="text-xs text-center mt-1 truncate">Foto {index + 1}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between">
                  <button
                    onClick={() => setSelectedVistoria(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      generateSinglePDF(selectedVistoria);
                      setSelectedVistoria(null);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Gerar e Imprimir PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPDFGenerator;