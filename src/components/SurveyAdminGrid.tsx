// components/SurveyAdminGrid.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, FileText, X, Download, AlertCircle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

// ==================== INTERFACES ====================
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

// ==================== COMPONENTE PRINCIPAL ====================
const SurveyAdminGrid: React.FC<SurveyAdminGridProps> = ({ 
  onSelect, 
  printedIds,
  projectId 
}) => {
  // Estados da GRID
  const [data, setData] = useState<SurveyAdmin[]>([]);
  const [search, setSearch] = useState('');
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [errorGrid, setErrorGrid] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados do MODAL
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Refs
  const hasProcessedRef = useRef<string>('');

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('📊 SurveyAdminGrid montado');

  // ==================== FUNÇÕES DO MODAL ====================
  
  const openPdfModal = (surveyId: string) => {
    console.log('🖨️ ABRINDO MODAL ÚNICO para:', surveyId);
    if (onSelect) onSelect(surveyId);
    setSelectedSurveyId(surveyId);
    setModalOpen(true);
    setErrorPdf(null);
    setPdfUrl('');
    hasProcessedRef.current = '';
  };

  const closePdfModal = () => {
    console.log('❌ FECHANDO MODAL');
    setModalOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl('');
    }
    setLoadingPdf(false);
    setErrorPdf(null);
  };

  // ==================== FUNÇÃO PARA GERAR PDF ====================
  const generateFormattedPDF = async (surveyId: string) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Configurações do Supabase não encontradas.");
    }

    // Função auxiliar para carregar imagens
    const loadImage = (src: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = reject;
        img.src = src;
      });
    };

    const url = `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin?id=eq.${surveyId}`;
    
    console.log('🌐 Buscando dados em:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status} ao buscar dados`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error("Registro não encontrado.");
    }
    
    const record = data[0];
    
    // Criar PDF com layout oficial
    const pdf = new jsPDF();
    
    // ============ CONFIGURAÇÕES GERAIS ============
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15; // Margem reduzida
    let y = margin;
    
    // ============ CABEÇALHO COM LOGOS ============
    // Logo GEA (esquerda)
    try {
      const geaLogo = await loadImage('/gea_logo.jpg');
      pdf.addImage(geaLogo, 'JPEG', margin, y, 25, 25); // Tamanho reduzido
    } catch (e) {
      console.log('Logo GEA não carregada');
    }
    
    // Logo Amapá Terras (direita)
    try {
      const amapaLogo = await loadImage('/amapaTerra.jpeg');
      pdf.addImage(amapaLogo, 'JPEG', pageWidth - margin - 25, y, 25, 25); // Tamanho reduzido
    } catch (e) {
      console.log('Logo Amapá Terras não carregada');
    }
    
    // Título centralizado - FONTE REDUZIDA
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GOVERNO DO ESTADO DO AMAPÁ', pageWidth / 2, y + 8, { align: 'center' });
    pdf.text('Amapá Terras - Instituto de Terras do Amapá', pageWidth / 2, y + 14, { align: 'center' });
    
    y += 30;
    
    // ============ TÍTULO PRINCIPAL ============
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO DE VISTORIA REURB', pageWidth / 2, y, { align: 'center' });
    
    y += 8;
    
    // Linha divisória fina
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    
    y += 12;
    
    // ============ DADOS DO PROJETO ============
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Projeto:', margin, y);
    pdf.setFont('helvetica', 'normal');
    
    // Projeto com quebra de linha se necessário
    const projetoText = record.projeto || 'Não informado';
    const projetoLines = pdf.splitTextToSize(projetoText, pageWidth - margin - 50);
    pdf.text(projetoLines, margin + 20, y);
    
    // Ajustar Y baseado no número de linhas do projeto
    y += projetoLines.length * 5 + 8;
    
    // ============ DADOS PRINCIPAIS (2 COLUNAS ORGANIZADAS) ============
    const col1X = margin;
    const col2X = pageWidth / 2;
    const labelWidth = 35; // Largura fixa para labels
    const valueXOffset = labelWidth + 5;
    
    // Função para adicionar linha de dado COM CONTROLE DE ESPAÇAMENTO
    const addDataLine = (label: string, value: any, col: number, currentY: number): number => {
      const x = col === 1 ? col1X : col2X;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, x, currentY);
      
      pdf.setFont('helvetica', 'normal');
      const formattedValue = formatValue(value);
      const maxWidth = (pageWidth / 2) - margin - 10;
      
      // Se o texto for muito longo, quebra em múltiplas linhas
      const lines = pdf.splitTextToSize(formattedValue, maxWidth);
      pdf.text(lines, x + valueXOffset, currentY);
      
      // Retorna nova posição Y baseado no número de linhas
      return currentY + (lines.length * 4.5);
    };
    
    const formatValue = (value: any): string => {
      if (value === null || value === undefined || value === '') return 'Não informado';
      if (value === true) return 'Sim';
      if (value === false) return 'Não';
      return String(value);
    };
    
    // DADOS DA COLUNA 1
    let yCol1 = y;
    yCol1 = addDataLine('Formulário', record.formulario, 1, yCol1);
    yCol1 = addDataLine('Quadra', record.quadra, 1, yCol1);
    yCol1 = addDataLine('Lote', record.lote, 1, yCol1);
    yCol1 = addDataLine('Requerente', record.requerente, 1, yCol1);
    yCol1 = addDataLine('RG', record.rg, 1, yCol1);
    yCol1 = addDataLine('Estado Civil', record.estado_civil, 1, yCol1);
    yCol1 = addDataLine('CPF', record.cpf, 1, yCol1);
    yCol1 = addDataLine('Profissão', record.profissao, 1, yCol1);
    
    // DADOS DA COLUNA 2
    let yCol2 = y;
    // Extrai o número REURB do campo formulario (ex: "REURB N°.: 5979/2026")
    let reurbNum = 'Não informado';
    if (record.formulario) {
      // Tenta extrair o número do formulário
      const match = record.formulario.match(/REURB\s*N[°\.:]\s*[:]?\s*([\d\/]+)/i);
      reurbNum = match ? match[1] : record.formulario;
    }

    yCol2 = addDataLine('REURB Nº', reurbNum, 2, yCol2);
    // Usa o campo correto para tipo de REURB (da análise IA ou tipo_reurb)
    const tipoReurb = record.analise_ia || record.tipo_reurb || 'REURB-S';
    yCol2 = addDataLine('TIPO REURB', tipoReurb, 2, yCol2);
    
    // ============ DADOS DO IMÓVEL ============
    // Linha divisória
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;
    
    // Título da seção
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DO IMÓVEL', margin, y);
    y += 8;
    
    // Reset para 2 colunas
    yCol1 = y;
    yCol2 = y;
    
    yCol1 = addDataLine('Endereço', record.endereco, 1, yCol1);
    yCol1 = addDataLine('Tempo Moradia', record.tempo_moradia, 1, yCol1);
    yCol1 = addDataLine('Tipo Aquisição', record.tipo_aquisicao, 1, yCol1);
    yCol1 = addDataLine('Uso Imóvel', record.uso_imovel, 1, yCol1);
    yCol1 = addDataLine('Construção', record.construcao, 1, yCol1);
    yCol1 = addDataLine('Telhado', record.telhado, 1, yCol1);
    
    yCol2 = addDataLine('Filhos Menores', record.filhos_menores, 2, yCol2);
    yCol2 = addDataLine('Piso', record.piso, 2, yCol2);
    yCol2 = addDataLine('Divisa', record.divisa, 2, yCol2);
    yCol2 = addDataLine('Comodos', record.comodos, 2, yCol2);
    yCol2 = addDataLine('Água', record.agua, 2, yCol2);
    yCol2 = addDataLine('Energia', record.energia, 2, yCol2);
    
    y = Math.max(yCol1, yCol2) + 10;
    
    // ============ INFRAESTRUTURA ============
    // Reset para 2 colunas
    yCol1 = y;
    yCol2 = y;
    
    yCol1 = addDataLine('Esgoto', record.esgoto, 1, yCol1);
    yCol1 = addDataLine('Pavimentação', record.pavimentacao, 1, yCol1);
    
    yCol2 = addDataLine('Análise IA', record.analise_ia, 2, yCol2);
    
    y = Math.max(yCol1, yCol2) + 15;
    
    // Verificar se ainda cabe na página
    if (y > pageHeight - 60) {
      // Se não couber, adiciona nova página
      pdf.addPage();
      y = margin;
    }
    
    // ============ ASSINATURAS ============
    // Título das assinaturas
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASSINATURAS', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    // Linha divisória
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Container para assinaturas lado a lado
    const signatureY = y;
    const signatureWidth = 70;
    const signatureHeight = 20;
    
    // Assinatura do Vistoriador (esquerda)
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VISTORIADOR:', margin, signatureY);
    
    if (record.assinatura_vistoriador && record.assinatura_vistoriador.trim() !== '') {
      try {
        const imgData = record.assinatura_vistoriador.includes(',') 
          ? record.assinatura_vistoriador.split(',')[1] 
          : record.assinatura_vistoriador;
        pdf.addImage(imgData, 'PNG', margin, signatureY + 5, signatureWidth, signatureHeight);
      } catch (err) {
        pdf.setFont('helvetica', 'normal');
        pdf.line(margin, signatureY + 12, margin + signatureWidth, signatureY + 12);
      }
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.line(margin, signatureY + 12, margin + signatureWidth, signatureY + 12);
    }
    
    // Assinatura do Requerente (direita)
    pdf.setFont('helvetica', 'bold');
    pdf.text('REQUERENTE:', pageWidth - margin - signatureWidth, signatureY);
    
    if (record.assinatura_requerente && record.assinatura_requerente.trim() !== '') {
      try {
        const imgData = record.assinatura_requerente.includes(',') 
          ? record.assinatura_requerente.split(',')[1] 
          : record.assinatura_requerente;
        pdf.addImage(imgData, 'PNG', pageWidth - margin - signatureWidth, signatureY + 5, signatureWidth, signatureHeight);
      } catch (err) {
        pdf.setFont('helvetica', 'normal');
        pdf.line(pageWidth - margin - signatureWidth, signatureY + 12, pageWidth - margin, signatureY + 12);
      }
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.line(pageWidth - margin - signatureWidth, signatureY + 12, pageWidth - margin, signatureY + 12);
    }
    
    y = signatureY + signatureHeight + 20;
    
    // ============ RODAPÉ ============
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const footerY = pageHeight - 8;
    pdf.text(`ID do Registro: ${record.id}`, pageWidth / 2, footerY - 5, { align: 'center' });
    pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, footerY, { align: 'center' });
    
    // Converter para blob e URL
    const blob = pdf.output('blob');
    const urlObj = URL.createObjectURL(blob);
    
    console.log('✅ PDF formatado gerado com sucesso!');
    return urlObj;
    
  } catch (err: any) {
    console.error('❌ Erro ao gerar PDF:', err);
    throw err;
  }
};

  // ==================== EFEITO PARA GERAR PDF ====================
  useEffect(() => {
    if (!modalOpen || !selectedSurveyId) {
      console.log('📭 Modal não está aberto ou sem ID');
      return;
    }
    
    if (hasProcessedRef.current === selectedSurveyId) {
      console.log('⏭️ Já processou este ID');
      return;
    }
    
    console.log('🚀 GERANDO PDF para:', selectedSurveyId);
    hasProcessedRef.current = selectedSurveyId;
    setLoadingPdf(true);
    setErrorPdf(null);
    
    const generateAndSetPDF = async () => {
      try {
        const url = await generateFormattedPDF(selectedSurveyId);
        setPdfUrl(url);
      } catch (err: any) {
        console.error('❌ Erro no PDF:', err);
        setErrorPdf(err.message || 'Erro ao gerar PDF');
        hasProcessedRef.current = '';
      } finally {
        setLoadingPdf(false);
      }
    };
    
    generateAndSetPDF();
    
    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [modalOpen, selectedSurveyId]);

  // ==================== FUNÇÕES DA GRID ====================
  
  const fetchSurveyData = async () => {
    setLoadingGrid(true);
    setErrorGrid('');
    
    try {
      console.log('🔄 Buscando dados para grid...');
      
      if (!SUPABASE_KEY) {
        throw new Error('Chave do Supabase não configurada.');
      }
      
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
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
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
      console.error('💥 Erro:', err);
      setErrorGrid(err.message || 'Erro ao carregar dados');
    } finally {
      setLoadingGrid(false);
    }
  };

  useEffect(() => {
    fetchSurveyData();
  }, [projectId]);

  // Filtro
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

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ==================== RENDERIZAÇÃO ====================
  
  return (
    <>
      {/* GRID */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Relatórios de Vistorias
          </h2>
          <div className="text-sm text-gray-600">
            {loadingGrid ? 'Carregando...' : `${filtered.length} registro(s)`}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por formulário, quadra, lote, requerente ou CPF..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {errorGrid && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errorGrid}</p>
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
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        onClick={() => openPdfModal(row.id)}
                        disabled={loadingPdf}
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

      {/* MODAL DO PDF */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold">Relatório de Vistoria</h2>
                  <p className="text-sm text-gray-500">ID: {selectedSurveyId.substring(0, 8)}...</p>
                </div>
              </div>
              <button 
                onClick={closePdfModal} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={loadingPdf}
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 bg-gray-50 relative">
              {loadingPdf ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-700">Gerando PDF...</p>
                </div>
              ) : errorPdf ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <p className="text-red-600 font-medium mb-2">Erro ao gerar PDF</p>
                  <p className="text-gray-600 text-sm mb-4">{errorPdf}</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        hasProcessedRef.current = '';
                        setErrorPdf(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                    <button 
                      onClick={closePdfModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : pdfUrl ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 bg-white border-b flex gap-3 justify-center">
                    <button 
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = pdfUrl;
                        a.download = `Vistoria_${selectedSurveyId}.pdf`;
                        a.click();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                    >
                      <Download size={18} /> Baixar PDF
                    </button>
                    <button 
                      onClick={() => iframeRef.current?.contentWindow?.print()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                      <Printer size={18} /> Imprimir
                    </button>
                  </div>
                  <iframe 
                    ref={iframeRef}
                    src={pdfUrl}
                    className="flex-1 w-full border-0"
                    title={`Relatório - ${selectedSurveyId}`}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-500">Preparando visualização...</p>
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