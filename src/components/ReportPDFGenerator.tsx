// components/ReportPDFGenerator.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, Download, Printer, FileText, Home, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Vistoria {
  id: string;
  property_id: string;
  survey_date: string;
  applicant_name: string;
  applicant_cpf: string;
  construction_type?: string;
  conservation_state?: string;
  water_supply?: boolean;
  energy_supply?: boolean;
  sanitation?: boolean;
  street_paving?: boolean;
  observations?: string;
  surveyor_name: string;
  state: string;
  created_at: string;
}

interface Lote {
  id: string;
  quadra_id: string;
  name: string;
  area: string;
  address: string;
  status: string;
}

interface Quadra {
  id: string;
  name: string;
}

const ReportPDFGenerator: React.FC = () => {
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [error, setError] = useState<string>('');

  // Configurações do Supabase
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mbcstctoikcnicmeyjgh.supabase.co';
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Headers para API
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  // Carregar todas as vistorias (consulta simples)
  const loadVistorias = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Carregando vistorias...');
      
      // Primeiro, tente carregar apenas algumas colunas básicas
      const response = await fetch(`${SUPABASE_URL}/rest/v1/reurb_surveys?select=id,property_id,survey_date,applicant_name,applicant_cpf,construction_type,conservation_state,water_supply,energy_supply,sanitation,street_paving,observations,surveyor_name,state,created_at`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar vistorias: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Vistorias carregadas:', data);
      setVistorias(Array.isArray(data) ? data : []);
      
      // Se houver vistorias, carregar lotes relacionados
      if (Array.isArray(data) && data.length > 0) {
        await loadLotes();
      }
      
    } catch (error) {
      console.error('Erro ao carregar vistorias:', error);
      setError('Erro ao carregar vistorias. Verifique o console para mais detalhes.');
      
      // Tenta uma consulta ainda mais simples
      try {
        const simpleResponse = await fetch(`${SUPABASE_URL}/rest/v1/reurb_surveys?select=id,property_id,survey_date,applicant_name,surveyor_name,state`, {
          headers,
        });
        
        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json();
          console.log('Vistorias carregadas (consulta simples):', simpleData);
          setVistorias(Array.isArray(simpleData) ? simpleData : []);
        }
      } catch (innerError) {
        console.error('Erro na consulta simples:', innerError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Carregar todos os lotes
  const loadLotes = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/reurb_properties?select=id,quadra_id,name,address,area,status`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Lotes carregados:', data);
        setLotes(Array.isArray(data) ? data : []);
        
        // Se houver lotes, carregar quadras
        if (Array.isArray(data) && data.length > 0) {
          await loadQuadras();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    }
  };

  // Carregar todas as quadras
  const loadQuadras = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/reurb_quadras?select=id,name`, {
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Quadras carregadas:', data);
        setQuadras(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar quadras:', error);
    }
  };

  // Inicializar
  useEffect(() => {
    loadVistorias();
  }, []);

  // Gerar PDF individual
  const generateSinglePDF = (vistoria: Vistoria) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 20;
      let yPos = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      const lote = lotes.find(l => l.id === vistoria.property_id);
      const quadra = quadras.find(q => q.id === lote?.quadra_id);
      
      // Cabeçalho
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO DE VISTORIA', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema REURB - Prefeitura Municipal', margin, yPos);
      yPos += 15;
      
      // 1. Identificação do Imóvel
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
      ];
      
      basicInfo.forEach(([label, value]) => {
        pdf.text(label, margin, yPos);
        pdf.text(value, margin + 40, yPos);
        yPos += 6;
      });
      
      yPos += 5;
      
      // 2. Dados da Vistoria
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. DADOS DA VISTORIA', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const vistoriaInfo = [
        ['Data:', new Date(vistoria.survey_date).toLocaleDateString('pt-BR')],
        ['Vistoriador:', vistoria.surveyor_name],
        ['Status:', vistoria.state],
      ];
      
      vistoriaInfo.forEach(([label, value]) => {
        pdf.text(label, margin, yPos);
        pdf.text(value, margin + 40, yPos);
        yPos += 6;
      });
      
      yPos += 5;
      
      // 3. Proprietário
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. PROPRIETÁRIO/POSSUIDOR', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const ownerInfo = [
        ['Nome:', vistoria.applicant_name],
        ['CPF:', vistoria.applicant_cpf || 'Não informado'],
      ];
      
      ownerInfo.forEach(([label, value]) => {
        pdf.text(label, margin, yPos);
        pdf.text(value, margin + 40, yPos);
        yPos += 6;
      });
      
      yPos += 10;
      
      // Rodapé
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 280, { align: 'center' });
      pdf.text(`ID da vistoria: ${vistoria.id.substring(0, 8)}...`, pageWidth / 2, 285, { align: 'center' });
      
      const fileName = `VISTORIA_${vistoria.id.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF. Verifique o console para mais detalhes.');
    }
  };

  // Gerar relatório consolidado
  const generateConsolidatedReport = () => {
    if (vistorias.length === 0) {
      alert('Não há vistorias para gerar relatório consolidado.');
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Título
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO CONSOLIDADO DE VISTORIAS', 105, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('SISTEMA REURB - PREFEITURA MUNICIPAL', 105, 27, { align: 'center' });
      pdf.text(`Total de vistorias: ${vistorias.length}`, 105, 34, { align: 'center' });
      
      // Tabela
      const tableData = vistorias.map((v, index) => {
        const lote = lotes.find(l => l.id === v.property_id);
        const quadra = quadras.find(q => q.id === lote?.quadra_id);
        return [
          index + 1,
          quadra?.name || '',
          lote?.name || '',
          v.surveyor_name,
          new Date(v.survey_date).toLocaleDateString('pt-BR'),
          v.applicant_name,
          v.state
        ];
      });
      
      (pdf as any).autoTable({
        startY: 40,
        head: [['#', 'Quadra', 'Lote', 'Vistoriador', 'Data', 'Proprietário', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204] },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 10, right: 10 }
      });
      
      // Rodapé
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 280, { align: 'center' });
      
      pdf.save(`RELATORIO_CONSOLIDADO_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error);
      alert('Erro ao gerar o relatório consolidado.');
    }
  };

  // Filtrar vistorias
  const filteredVistorias = vistorias.filter(vistoria => {
    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matches = 
        vistoria.surveyor_name?.toLowerCase().includes(searchLower) ||
        vistoria.applicant_name?.toLowerCase().includes(searchLower);
      
      // Também verifica no lote e quadra se disponíveis
      const lote = lotes.find(l => l.id === vistoria.property_id);
      const quadra = quadras.find(q => q.id === lote?.quadra_id);
      
      return matches ||
        (lote?.name?.toLowerCase().includes(searchLower)) ||
        (quadra?.name?.toLowerCase().includes(searchLower));
    }
    return true;
  }).filter(vistoria => {
    // Filtro por status
    if (statusFilter) return vistoria.state === statusFilter;
    return true;
  }).filter(vistoria => {
    // Filtro por data
    if (dateFilter.start && vistoria.survey_date < dateFilter.start) return false;
    if (dateFilter.end && vistoria.survey_date > dateFilter.end) return false;
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
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                onClick={() => loadVistorias()}
                className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
              >
                Tentar novamente
              </button>
            </div>
          )}
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
              {loading ? 'Carregando...' : 'Atualizar Dados'}
            </button>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setDateFilter({ start: '', end: '' });
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
          ) : vistorias.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma vistoria encontrada no banco de dados</p>
              <p className="text-sm text-gray-400 mt-1">Verifique se existem vistorias cadastradas</p>
              <button
                onClick={() => loadVistorias()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar carregar novamente
              </button>
            </div>
          ) : filteredVistorias.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma vistoria encontrada com os filtros atuais</p>
              <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setDateFilter({ start: '', end: '' });
                }}
                className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    Mostrando {filteredVistorias.length} de {vistorias.length} vistorias
                  </div>
                  <div className="text-xs text-gray-500">
                    {lotes.length} lotes, {quadras.length} quadras carregadas
                  </div>
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
                            <div className="text-sm text-gray-900">{vistoria.surveyor_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vistoria.applicant_name}</div>
                            <div className="text-sm text-gray-500">{vistoria.applicant_cpf || 'CPF não informado'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(vistoria.survey_date).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vistoria.state === 'completed' ? 'bg-green-100 text-green-800' :
                              vistoria.state === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              vistoria.state === 'approved' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {vistoria.state === 'completed' ? 'Concluída' :
                               vistoria.state === 'pending' ? 'Pendente' :
                               vistoria.state === 'approved' ? 'Aprovada' : 
                               vistoria.state === 'rejected' ? 'Rejeitada' : vistoria.state}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => generateSinglePDF(vistoria)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Gerar PDF desta vistoria"
                            >
                              <Printer className="w-5 h-5" />
                            </button>
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
      </div>
    </div>
  );
};

export default ReportPDFGenerator;