// components/SurveyAdminGrid.tsx - COM MODAL INTEGRADO
import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, FileText, X, Download, AlertCircle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

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
  onSelect?: (surveyId: string) => void; // Opcional agora
  printedIds: string[];
  projectId?: string;
}

const SurveyAdminGrid: React.FC<SurveyAdminGridProps> = ({ 
  onSelect, 
  printedIds,
  projectId 
}) => {
  // ============ ESTADOS DA GRID ============
  const [data, setData] = useState<SurveyAdmin[]>([]);
  const [search, setSearch] = useState('');
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [errorGrid, setErrorGrid] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // ============ ESTADOS DO MODAL ============
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Flag para controlar processamento
  const processedIdRef = useRef<string>('');

  // Configurações do Supabase
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mbcstctoikcnicmeyjgh.supabase.co';
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔧 SurveyAdminGrid iniciado');

  // ============ FUNÇÕES DA GRID (EXISTENTES) ============
  
  const getHeaders = () => {
    if (!SUPABASE_KEY) {
      console.error('ERRO: Chave do Supabase não encontrada!');
      return {};
    }
    
    return {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchSurveyData = async () => {
    setLoadingGrid(true);
    setErrorGrid('');
    
    try {
      console.log('🔄 Buscando dados da view vw_reurb_surveys_admin...');
      
      if (!SUPABASE_KEY) {
        throw new Error('Chave do Supabase não configurada. Verifique o arquivo .env');
      }
      
      let url = `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin`;
      
      const params = new URLSearchParams();
      params.append('select', 'id,projeto,quadra,lote,formulario,requerente,cpf');
      params.append('order', 'id.desc');
      params.append('limit', '200');
      
      url = `${url}?${params.toString()}`;
      
      console.log('🌐 URL da requisição (resumida):', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      console.log('📊 Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ ${result.length} registros carregados`);
      
      const formattedData = result.map((item: any) => ({
        id: String(item.id || ''),
        Formulario: item.formulario ? String(item.formulario) : '-',
        Projeto: item.projeto ? String(item.projeto) : '-',
        Quadra: item.quadra ? String(item.quadra) : '-',
        Lote: item.lote ? String(item.lote) : '-',
        Requerente: item.requerente ? String(item.requerente) : '-',
        CPF: item.cpf ? String(item.cpf) : '-'
      }));
      
      setData(formattedData);
      
    } catch (err: any) {
      console.error('💥 Erro ao carregar dados:', err);
      setErrorGrid(err.message || 'Erro desconhecido ao carregar dados');
    } finally {
      setLoadingGrid(false);
    }
  };

  // ============ FUNÇÕES DO MODAL ============
  
  const handlePrintClick = (surveyId: string) => {
    console.log('🖨️ Clicou no botão de impressão, ID:', surveyId);
    
    // Chama a função onSelect se existir (para compatibilidade)
    if (onSelect) {
      onSelect(surveyId);
    }
    
    // Abre o modal
    setSelectedSurveyId(surveyId);
    setModalOpen(true);
    setErrorPdf(null);
    setPdfUrl('');
    processedIdRef.current = ''; // Força novo processamento
  };

  const closeModal = () => {
    console.log('❌ Fechando modal');
    setModalOpen(false);
    
    // Limpa recursos do PDF
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl('');
    }
    
    setLoadingPdf(false);
    setErrorPdf(null);
  };

  // Efeito para gerar PDF quando modal abre
  useEffect(() => {
    if (!modalOpen || !selectedSurveyId) return;
    
    // Se já processamos este ID, não gera novamente
    if (processedIdRef.current === selectedSurveyId && pdfUrl) {
      console.log('⏭️ PDF já gerado para este ID');
      return;
    }
    
    console.log('🚀 Iniciando geração de PDF para:', selectedSurveyId);
    processedIdRef.current = selectedSurveyId;
    setLoadingPdf(true);
    setErrorPdf(null);
    
    const generatePDFAsync = async () => {
      try {
        // Buscar dados COMPLETOS para o PDF
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin?id=eq.${selectedSurveyId}`,
          {
            method: 'GET',
            headers: getHeaders(),
          }
        );
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status} ao buscar dados`);
        }
        
        const data = await response.json();
        
        if (!data || data.length === 0) {
          throw new Error('Registro não encontrado');
        }
        
        const record = data[0];
        
        // Gerar PDF
        const pdf = new jsPDF();
        let y = 20;
        
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
        
        // Dados básicos
        addRow('Projeto:', record.projeto, 'Formulário:', record.formulario);
        addRow('Quadra:', record.quadra, 'Lote:', record.lote);
        addRow('Requerente:', record.requerente, 'CPF:', record.cpf);
        
        // Gerar blob
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        
        console.log('✅ PDF gerado com sucesso');
        setPdfUrl(url);
        
      } catch (err: any) {
        console.error('❌ Erro ao gerar PDF:', err);
        setErrorPdf(err.message || 'Erro ao gerar PDF');
        processedIdRef.current = ''; // Permite tentar novamente
      } finally {
        setLoadingPdf(false);
      }
    };
    
    generatePDFAsync();
    
    // Cleanup
    return () => {
      console.log('🧹 Cleanup do efeito do PDF');
    };
  }, [modalOpen, selectedSurveyId]);

  // ============ CÓDIGO EXISTENTE DA GRID ============
  
  useEffect(() => {
    fetchSurveyData();
  }, [projectId]);

  // Filtro de pesquisa
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
    
    return fields.some(field => 
      field.toString().toLowerCase().includes(searchTerm)
    );
  });

  // Cálculos de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ============ RENDERIZAÇÃO ============
  
  return (
    <>
      {/* GRID (código existente) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Relatórios de Vistorias
          </h2>
          
          <div className="text-sm text-gray-600">
            {loadingGrid ? 'Carregando...' : `${filtered.length} registro(s)`}
            {projectId && ` para o projeto ${projectId}`}
          </div>
        </div>
        
        {/* Área de Pesquisa */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por Formulário, Quadra, Lote, Requerente ou CPF"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Mensagem de Erro */}
        {errorGrid && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errorGrid}</p>
            <button
              onClick={fetchSurveyData}
              className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        )}
        
        {/* Tabela de Dados */}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingGrid ? (
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
                    {search ? 'Nenhum registro encontrado para a pesquisa' : 'Nenhum registro disponível'}
                  </td>
                </tr>
              ) : (
                currentItems.map((row) => (
                  <tr 
                    key={row.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      printedIds.includes(row.id) ? 'bg-green-50' : ''
                    }`}
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
                        title="Gerar PDF deste relatório"
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
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
        
        {/* Paginação */}
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

      {/* MODAL DE PDF */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold">Relatório de Vistoria</h2>
                  <p className="text-sm text-gray-500">
                    ID: {selectedSurveyId.substring(0, 8)}...
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 bg-gray-50 relative">
              {loadingPdf ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-700">Gerando relatório...</p>
                </div>
              ) : errorPdf ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <p className="text-red-600 font-medium mb-4">{errorPdf}</p>
                  <button 
                    onClick={() => {
                      processedIdRef.current = '';
                      setErrorPdf(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : pdfUrl ? (
                <div className="h-full flex flex-col">
                  {/* Botões de ação */}
                  <div className="p-4 bg-white border-b flex gap-3 justify-center">
                    <button 
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = pdfUrl;
                        a.download = `Relatorio_${selectedSurveyId}.pdf`;
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
                  
                  {/* Visualizador PDF */}
                  <iframe 
                    ref={iframeRef}
                    src={pdfUrl}
                    className="flex-1 w-full border-0"
                    title={`Relatório - ${selectedSurveyId}`}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-500">Preparando...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SurveyAdminGrid;