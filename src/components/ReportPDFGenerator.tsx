// components/ReportPDFGenerator.tsx
import React, { useState, useEffect } from 'react';
import { Search, Printer, FileText } from 'lucide-react';
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

// --- NOVO COMPONENTE: Grid de Pesquisa e Seleção ---
interface SurveyAdmin {
  id: string;
  formulario: string;
  projeto: string;
  quadra: string;
  lote: string;
  requerente: string;
  cpf: string;
}

const SurveyAdminGrid: React.FC<{
  onSelect: (id: string) => void;
  printedIds: string[];
  markPrinted: (id: string) => void;
}> = ({ onSelect, printedIds, markPrinted }) => {
  const [data, setData] = useState<SurveyAdmin[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Consulta Supabase REST API (vw_reurb_surveys_admin)
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mbcstctoikcnicmeyjgh.supabase.co';
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await fetch(
          `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin?select=id,formulario,projeto,quadra,lote,requerente,cpf`,
          { headers }
        );
        if (!resp.ok) throw new Error('Erro ao buscar dados');
        const rows = await resp.json();
        setData(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        setError('Erro ao carregar dados da grid.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtro de pesquisa
  const filtered = data.filter(row => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      row.formulario?.toLowerCase().includes(s) ||
      row.quadra?.toLowerCase().includes(s) ||
      row.lote?.toLowerCase().includes(s) ||
      row.requerente?.toLowerCase().includes(s) ||
      row.cpf?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-blue-600" />
        Relatórios de Vistorias (Admin)
      </h2>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por Formulário, Quadra, Lote, Requerente ou CPF"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">ID</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">Formulário</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">Projeto</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">Quadra</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">Lote</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">Requerente</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">CPF</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">Ação</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8">Nenhum registro encontrado</td></tr>
            ) : (
              filtered.map(row => (
                <tr key={row.id}
                  className={
                    printedIds.includes(row.id)
                      ? 'bg-green-50'
                      : ''
                  }
                >
                  <td className="px-3 py-2 text-xs text-gray-700">{row.id}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{row.formulario}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{row.projeto}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{row.quadra}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{row.lote}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{row.requerente}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{row.cpf}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    <button
                      title="Visualizar/Imprimir PDF"
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                      onClick={() => {
                        onSelect(row.id);
                        markPrinted(row.id);
                      }}
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- FIM GRID ---

const ReportPDFGenerator: React.FC<{ surveyId?: string; onClose?: () => void }> = ({ surveyId, onClose }) => {
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

  // Gerar PDF individual por ID (busca Supabase e monta PDF)
  const generateSinglePDFById = async (surveyId: string) => {
    try {
      // Buscar dados detalhados da vistoria pelo ID
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mbcstctoikcnicmeyjgh.supabase.co';
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      };
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin?id=eq.${surveyId}`,
        { headers }
      );
      if (!resp.ok) throw new Error('Erro ao buscar dados do relatório');
      const [row] = await resp.json();
      if (!row) throw new Error('Registro não encontrado');

      // Montar PDF (exemplo simples, pode ser expandido)
      const pdf = new jsPDF('p', 'mm', 'a4');
      let y = 20;
      pdf.setFontSize(16);
      pdf.text('RELATÓRIO DE VISTORIA', 20, y);
      y += 10;
      pdf.setFontSize(10);
      pdf.text('Sistema REURB - Prefeitura Municipal', 20, y);
      y += 15;
      pdf.setFontSize(12);
      pdf.text('1. DADOS DO FORMULÁRIO', 20, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.text(`ID: ${row.id}`, 20, y); y += 6;
      pdf.text(`Formulário: ${row.formulario}`, 20, y); y += 6;
      pdf.text(`Projeto: ${row.projeto}`, 20, y); y += 6;
      pdf.text(`Quadra: ${row.quadra}`, 20, y); y += 6;
      pdf.text(`Lote: ${row.lote}`, 20, y); y += 6;
      pdf.text(`Requerente: ${row.requerente}`, 20, y); y += 6;
      pdf.text(`CPF: ${row.cpf}`, 20, y); y += 10;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 280, { align: 'center' });
      pdf.text(`ID: ${row.id}`, 105, 285, { align: 'center' });

      // Abrir PDF em nova aba
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      alert('Erro ao gerar PDF. Verifique o console.');
      console.error(error);
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

  // Estado para controlar IDs impressos e seleção
  const [printedIds, setPrintedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Marcar registro como impresso
  const markPrinted = (id: string) => {
    setPrintedIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  // Quando seleciona um registro, gera PDF
  useEffect(() => {
    if (selectedId) {
      generateSinglePDFById(selectedId);
    }
    // eslint-disable-next-line
  }, [selectedId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Grid de Pesquisa e Seleção */}
        <SurveyAdminGrid
          onSelect={id => setSelectedId(id)}
          printedIds={printedIds}
          markPrinted={markPrinted}
        />
      </div>
    </div>
  );
};

export default ReportPDFGenerator;