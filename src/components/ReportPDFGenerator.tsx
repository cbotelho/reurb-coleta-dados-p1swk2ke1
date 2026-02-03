// components/ReportPDFGenerator.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, Download, Printer, FileText, Home, FileDown } from 'lucide-react';
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
  form_number?: string;
  survey_date: string;
  applicant_name: string;
  applicant_cpf: string;
  applicant_telefone?: string;
  construction_type: string;
  conservation_state: string;
  water_supply: boolean;
  energy_supply: boolean;
  sanitation: boolean;
  street_paving: boolean;
  public_lighting?: boolean;
  observations: string;
  fotos_urls?: string[];
  surveyor_name: string;
  surveyor_matricula?: string;
  status: string;
  created_at: string;
}

const ReportPDFGenerator: React.FC = () => {
  const { projectId } = useParams();
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/reurb_quadras?select=id,name,area,description&order=name.asc`, {
        headers,
      });
      const data = await response.json();
      setQuadras(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar quadras:', error);
    }
  };

  // Carregar todas as vistorias
  const loadVistorias = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/reurb_surveys?select=*&order=created_at.desc`, { headers });
      const data = await response.json();
      console.log('Dados carregados do Supabase:', data); // Debug
      setVistorias(Array.isArray(data) ? data : []);
      
      // Carregar lotes relacionados
      const loteIds = Array.isArray(data) ? [...new Set(data.map((v: Vistoria) => v.property_id))] : [];
      if (loteIds.length > 0) {
        await loadLotesByIds(loteIds);
      }
      await loadQuadras();
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
      console.log('Lotes carregados:', data); // Debug
      setLotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    }
  };

  // Inicializar
  useEffect(() => {
    loadVistorias();
  }, []);

  // Gerar PDF individual
  const generateSinglePDF = (vistoria: Vistoria) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    let yPos = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const lote = lotes.find(l => l.id === vistoria.property_id);
    const quadra = quadras.find(q => q.id === lote?.quadra_id);
    
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
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. DADOS DA VISTORIA', margin, yPos);
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const vistoriaInfo = [
      ['Data:', new Date(vistoria.survey_date).toLocaleDateString('pt-BR')],
      ['Vistoriador:', vistoria.surveyor_name],
      ['Matrícula:', vistoria.surveyor_matricula || 'Não informada'],
      ['Status:', vistoria.status],
    ];
    
    vistoriaInfo.forEach(([label, value]) => {
      pdf.text(label, margin, yPos);
      pdf.text(value, margin + 40, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. PROPRIETÁRIO/POSSUIDOR', margin, yPos);
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const ownerInfo = [
      ['Nome:', vistoria.applicant_name],
      ['CPF:', vistoria.applicant_cpf],
      ['Telefone:', vistoria.applicant_telefone || 'Não informado'],
    ];
    
    ownerInfo.forEach(([label, value]) => {
      pdf.text(label, margin, yPos);
      pdf.text(value, margin + 40, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('4. CARACTERÍSTICAS DA CONSTRUÇÃO', margin, yPos);
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const characteristics = [
      ['Tipo de Construção:', vistoria.construction_type || 'Não informado'],
      ['Estado de Conservação:', vistoria.conservation_state || 'Não informado'],
    ];
    
    characteristics.forEach(([label, value]) => {
      pdf.text(label, margin, yPos);
      pdf.text(value, margin + 60, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('5. INFRAESTRUTURA DISPONÍVEL', margin, yPos);
    yPos += 10;
    
    const infrastructure = [
      ['Água encanada', vistoria.water_supply],
      ['Energia elétrica', vistoria.energy_supply],
      ['Rede de esgoto', vistoria.sanitation],
      ['Pavimentação', vistoria.street_paving],
      ['Iluminação pública', vistoria.public_lighting || false],
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
    
    if (vistoria.observations) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('6. OBSERVAÇÕES', margin, yPos);
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const observations = pdf.splitTextToSize(vistoria.observations, pageWidth - (2 * margin));
      pdf.text(observations, margin, yPos);
      yPos += observations.length * 5 + 5;
    }
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('7. ASSINATURAS', margin, yPos);
    yPos += 15;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text('________________________________________', margin, yPos);
    pdf.text('Proprietário/Possuidor', margin + 20, yPos + 8);
    pdf.text(vistoria.applicant_name, margin, yPos + 16);
    pdf.text(`CPF: ${vistoria.applicant_cpf}`, margin, yPos + 22);
    
    pdf.text('________________________________________', margin + 100, yPos);
    pdf.text('Vistoriador Técnico', margin + 120, yPos + 8);
    pdf.text(vistoria.surveyor_name, margin + 100, yPos + 16);
    pdf.text(`Matrícula: ${vistoria.surveyor_matricula || 'Não informada'}`, margin + 100, yPos + 22);
    
    yPos += 40;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
    pdf.text('Sistema REURB - Prefeitura Municipal', pageWidth / 2, yPos + 5, { align: 'center' });
    pdf.text(`ID da vistoria: ${vistoria.id.substring(0, 8)}...`, pageWidth / 2, yPos + 10, { align: 'center' });
    
    const fileName = `VISTORIA_${quadra?.name || 'Q'}_${lote?.name || 'L'}_${vistoria.surveyor_name.replace(/\s+/g, '_')}_${new Date(vistoria.survey_date).toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  // Gerar relatório consolidado
  const generateConsolidatedReport = () => {
    if (vistorias.length === 0) {
      alert('Não há vistorias para gerar relatório consolidado.');
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO CONSOLIDADO DE VISTORIAS', 105, 20, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('SISTEMA REURB - PREFEITURA MUNICIPAL', 105, 27, { align: 'center' });
    pdf.text(`Período: ${dateFilter.start || 'Início'} até ${dateFilter.end || 'Fim'}`, 105, 34, { align: 'center' });
    pdf.text(`Total de vistorias: ${vistorias.length}`, 105, 41, { align: 'center' });
    
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
      ['Com água:', vistorias.filter(v => v.water_supply).length.toString()],
      ['Com energia:', vistorias.filter(v => v.energy_supply).length.toString()],
      ['Com esgoto:', vistorias.filter(v => v.sanitation).length.toString()],
    ];
    
    let y = statsY + 10;
    stats.forEach(([label, value]) => {
      pdf.text(label, 20, y);
      pdf.text(value, 80, y);
      y += 6;
    });
    
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 280, { align: 'center' });
    pdf.text('Sistema REURB - Relatório Consolidado', 105, 285, { align: 'center' });
    
    pdf.save(`RELATORIO_CONSOLIDADO_VISTORIAS_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Filtrar vistorias
  const filteredVistorias = vistorias
    .filter(vistoria => {
      const lote = lotes.find(l => l.id === vistoria.property_id);
      const quadra = quadras.find(q => q.id === lote?.quadra_id);
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (vistoria.surveyor_name && vistoria.surveyor_name.toLowerCase().includes(searchLower)) ||
          (vistoria.applicant_name && vistoria.applicant_name.toLowerCase().includes(searchLower)) ||
          (lote?.name && lote.name.toLowerCase().includes(searchLower)) ||
          (quadra?.name && quadra.name.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .filter(vistoria => {
      if (statusFilter) return vistoria.status === statusFilter;
      return true;
    })
    .filter(vistoria => {
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
              Atualizar Dados
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
          ) : filteredVistorias.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma vistoria encontrada</p>
              <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
              <p className="text-xs text-gray-400 mt-2">
                Dados carregados: {vistorias.length} vistorias, {lotes.length} lotes, {quadras.length} quadras
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    {filteredVistorias.length} vistorias encontradas
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
                            <div className="text-sm text-gray-500">{vistoria.surveyor_matricula || 'Sem matrícula'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vistoria.applicant_name}</div>
                            <div className="text-sm text-gray-500">{vistoria.applicant_cpf}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(vistoria.survey_date).toLocaleDateString('pt-BR')}
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
                            <button
                              onClick={() => generateSinglePDF(vistoria)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg"
                              title="Gerar PDF"
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