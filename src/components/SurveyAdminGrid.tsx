// components/SurveyAdminGrid.tsx - VERSÃO FINAL COM ASSINATURAS
import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, FileText, X, Download, AlertCircle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

// ==================== COMPONENTE MODAL DE PDF ====================
const ReportPDFModal: React.FC<{
  surveyId: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ surveyId, isOpen, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const hasProcessedRef = useRef<string>('');

  console.log('📄 Modal PDF, ID:', surveyId, 'Aberto:', isOpen);

  // Função para converter base64 em dados da imagem
  const getImageDataFromBase64 = (base64String: string) => {
    if (!base64String) return null;
    
    // Remove prefixo se existir
    const base64Data = base64String.includes(',') 
      ? base64String.split(',')[1] 
      : base64String;
    
    return base64Data;
  };

  // Efeito para buscar dados COMPLETOS e gerar PDF
  useEffect(() => {
    if (!isOpen || !surveyId) return;
    
    if (hasProcessedRef.current === surveyId) {
      console.log('⏭️ Já processamos este ID');
      return;
    }
    
    console.log('🚀 Buscando dados COMPLETOS para PDF');
    hasProcessedRef.current = surveyId;
    setLoading(true);
    setError(null);
    setPdfUrl('');
    
    const generatePDF = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Configurações do Supabase não encontradas.");
        }

        // CONSULTA COMPLETA incluindo assinaturas
        const fields = [
          'id', 'projeto', 'quadra', 'lote', 'formulario', 'requerente', 'cpf',
          'rg', 'estado_civil', 'profissao', 'renda_familiar', 'nis', 'endereco',
          'conjuge', 'cpf_conjuge', 'num_moradores', 'num_filhos', 'filhos_menores',
          'tempo_moradia', 'tipo_aquisicao', 'uso_imovel', 'construcao', 'telhado',
          'piso', 'divisa', 'comodos', 'agua', 'energia', 'esgoto', 'pavimentacao',
          'analise_ia', 'assinatura_vistoriador', 'assinatura_requerente'
        ];
        
        const query = `id=eq.${surveyId}&select=${fields.join(',')}`;
        const url = `${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?${query}`;
        
        console.log('🌐 Buscando dados COMPLETOS:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📊 Status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || data.length === 0) {
          throw new Error("Registro não encontrado.");
        }
        
        const record = data[0];
        console.log('📄 Registro com assinaturas:', {
          id: record.id,
          temAssinaturaVistoriador: !!record.assinatura_vistoriador,
          temAssinaturaRequerente: !!record.assinatura_requerente
        });

        // Gerar PDF
        const pdf = new jsPDF();
        let y = 20;
        
        // Título
        pdf.setFontSize(16);
        pdf.text('RELATÓRIO DE VISTORIA REURB', 105, y, { align: 'center' });
        y += 15;
        
        pdf.setFontSize(10);
        
        const formatValue = (value: any): string => {
          if (value === null || value === undefined || value === '') return 'N/A';
          return String(value);
        };
        
        const addRow = (label: string, value: any, label2: string, value2: any) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(label, 20, y);
          pdf.setFont('helvetica', 'normal');
          pdf.text(formatValue(value), 60, y);
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(label2, 120, y);
          pdf.setFont('helvetica', 'normal');
          pdf.text(formatValue(value2), 160, y);
          y += 8;
        };

        // Dados principais
        addRow('Projeto:', record.projeto, 'Formulário:', record.formulario);
        addRow('Quadra:', record.quadra, 'Lote:', record.lote);
        addRow('Requerente:', record.requerente, 'CPF:', record.cpf);
        addRow('RG:', record.rg, 'Estado Civil:', record.estado_civil);
        addRow('Profissão:', record.profissao, 'Renda:', record.renda_familiar);
        addRow('Endereço:', record.endereco, 'NIS:', record.nis);
        
        y += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Família:', 20, y);
        y += 8;
        addRow('Cônjuge:', record.conjuge, 'CPF Cônjuge:', record.cpf_conjuge);
        addRow('Moradores:', record.num_moradores, 'Filhos:', record.num_filhos);
        addRow('Filhos Menores:', record.filhos_menores, 'Tempo Moradia:', record.tempo_moradia);
        
        y += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Características do Imóvel:', 20, y);
        y += 8;
        addRow('Construção:', record.construcao, 'Telhado:', record.telhado);
        addRow('Piso:', record.piso, 'Divisa:', record.divisa);
        addRow('Cômodos:', record.comodos, 'Água:', record.agua);
        addRow('Energia:', record.energia, 'Esgoto:', record.esgoto);
        
        // Análise técnica
        if (record.analise_ia) {
          y += 10;
          pdf.setFont('helvetica', 'bold');
          pdf.text('Análise Técnica:', 20, y);
          y += 7;
          pdf.setFont('helvetica', 'normal');
          const lines = pdf.splitTextToSize(record.analise_ia, 170);
          pdf.text(lines, 20, y);
          y += (lines.length * 5);
        }

        // ASSINATURAS
        y += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Assinaturas:', 20, y);
        y += 8;
        
        // Assinatura do Vistoriador
        if (record.assinatura_vistoriador) {
          try {
            const imgData = getImageDataFromBase64(record.assinatura_vistoriador);
            if (imgData) {
              pdf.text('Vistoriador:', 20, y);
              pdf.addImage(imgData, 'PNG', 50, y - 5, 40, 20);
              y += 25;
            }
          } catch (err) {
            console.warn('❌ Erro ao processar assinatura do vistoriador:', err);
            pdf.text('Vistoriador: Assinatura não disponível', 20, y);
            y += 8;
          }
        } else {
          pdf.text('Vistoriador: Não assinado', 20, y);
          y += 8;
        }
        
        // Assinatura do Requerente
        if (record.assinatura_requerente) {
          try {
            const imgData = getImageDataFromBase64(record.assinatura_requerente);
            if (imgData) {
              pdf.text('Requerente:', 20, y);
              pdf.addImage(imgData, 'PNG', 50, y - 5, 40, 20);
              y += 25;
            }
          } catch (err) {
            console.warn('❌ Erro ao processar assinatura do requerente:', err);
            pdf.text('Requerente: Assinatura não disponível', 20, y);
            y += 8;
          }
        } else {
          pdf.text('Requerente: Não assinado', 20, y);
          y += 8;
        }

        const blob = pdf.output('blob');
        const urlObj = URL.createObjectURL(blob);
        
        console.log('✅ PDF gerado com assinaturas!');
        setPdfUrl(urlObj);
        
      } catch (err: any) {
        console.error('❌ Erro:', err);
        setError(err.message || 'Erro ao gerar PDF');
        hasProcessedRef.current = '';
      } finally {
        setLoading(false);
      }
    };
    
    generatePDF();
    
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [isOpen, surveyId]);

  // Não renderiza se não está aberto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">Relatório de Vistoria REURB</h2>
              <p className="text-sm text-gray-500">ID: {surveyId?.substring(0, 8)}...</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 bg-gray-50 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-700">Gerando PDF com dados completos...</p>
              <p className="text-sm text-gray-500 mt-2">Incluindo assinaturas</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button 
                onClick={() => {
                  hasProcessedRef.current = '';
                  setError(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          ) : pdfUrl ? (
            <div className="h-full flex flex-col">
              <div className="p-4 bg-white border-b flex gap-3 justify-center">
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = pdfUrl;
                    a.download = `Relatorio_REURB_${surveyId}.pdf`;
                    a.click();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
                >
                  <Download size={18} /> Baixar PDF
                </button>
                <button 
                  onClick={() => iframeRef.current?.contentWindow?.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                  <Printer size={18} /> Imprimir
                </button>
              </div>
              <iframe 
                ref={iframeRef}
                src={pdfUrl}
                className="flex-1 w-full border-0"
                title={`Relatório REURB - ${surveyId}`}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p>Preparando visualização...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE GRID (SIMPLIFICADO) ====================
interface SurveyAdmin {
  id: string;
  Formulario: string;
  Projeto: string;
  Quadra: string;
  Lote: string;
  Requerente: string;
  CPF: string;
}

interface SurveyAdminGridProps {
  onSelect?: (surveyId: string) => void;
  printedIds: string[];
  projectId?: string;
}

const SurveyAdminGrid: React.FC<SurveyAdminGridProps> = ({ 
  onSelect, 
  printedIds,
  projectId 
}) => {
  const [data, setData] = useState<SurveyAdmin[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handlePrintClick = (surveyId: string) => {
    console.log('🖨️ Abrindo modal para:', surveyId);
    if (onSelect) onSelect(surveyId);
    setSelectedId(surveyId);
    setModalOpen(true);
  };

  const fetchSurveyData = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!SUPABASE_KEY) throw new Error('Chave do Supabase não configurada.');
      
      let url = `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin`;
      const params = new URLSearchParams();
      params.append('select', 'id,projeto,quadra,lote,formulario,requerente,cpf');
      params.append('order', 'id.desc');
      params.append('limit', '200');
      
      url = `${url}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      
      const result = await response.json();
      const formattedData = result.map((item: any) => ({
        id: String(item.id || ''),
        Formulario: item.formulario || '-',
        Projeto: item.projeto || '-',
        Quadra: item.quadra || '-',
        Lote: item.lote || '-',
        Requerente: item.requerente || '-',
        CPF: item.cpf || '-'
      }));
      
      setData(formattedData);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyData();
  }, [projectId]);

  const filtered = data.filter(row => {
    if (!search.trim()) return true;
    const searchTerm = search.toLowerCase().trim();
    const fields = [
      row.Formulario || '',
      row.Quadra || '',
      row.Lote || '',
      row.Requerente || '',
      row.CPF || ''
    ];
    return fields.some(field => field.toLowerCase().includes(searchTerm));
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Relatórios de Vistorias
          </h2>
          <div className="text-sm text-gray-600">
            {loading ? 'Carregando...' : `${filtered.length} registro(s)`}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Formulário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Projeto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quadra</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lote</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requerente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CPF</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PDF</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <span className="text-gray-600">Carregando vistorias...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {search ? 'Nenhum registro encontrado' : 'Nenhum registro disponível'}
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => (
                  <tr 
                    key={row.id}
                    className={`hover:bg-gray-50 ${printedIds.includes(row.id) ? 'bg-green-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {row.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.Formulario}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.Projeto}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.Quadra}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.Lote}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.Requerente}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.CPF}</td>
                    <td className="px-4 py-3">
                      <button
                        title="Gerar PDF"
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                        onClick={() => handlePrintClick(row.id)}
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
        
        {filtered.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6 px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* APENAS UM MODAL - o correto */}
      <ReportPDFModal
        surveyId={selectedId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default SurveyAdminGrid;