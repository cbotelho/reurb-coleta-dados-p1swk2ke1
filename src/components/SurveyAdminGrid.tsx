import React, { useState, useEffect } from 'react';
import { Search, Printer, FileText } from 'lucide-react';

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
  onSelect: (surveyId: string) => void; // MUDADO: agora só precisa do ID
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

  // Configurações do Supabase
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mbcstctoikcnicmeyjgh.supabase.co';
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔧 Configuração Supabase:', {
    url: SUPABASE_URL,
    keyPresent: !!SUPABASE_KEY
  });

  // Headers para Supabase
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

  // Buscar dados da view vw_reurb_surveys_admin - APENAS COLUNAS NECESSÁRIAS
  const fetchSurveyData = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 Buscando dados da view vw_reurb_surveys_admin...');
      
      if (!SUPABASE_KEY) {
        throw new Error('Chave do Supabase não configurada. Verifique o arquivo .env');
      }
      
      // IMPORTANTE: Vamos tentar uma consulta mais leve
      // Selecionando apenas as colunas necessárias para a grid
      let url = `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin`;
      
      // Parâmetros da query
      const params = new URLSearchParams();
      params.append('select', 'id,projeto,quadra,lote,formulario,requerente,cpf');
      params.append('order', 'id.desc');
      
      // Adiciona limite para performance
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
        console.error('❌ Erro na resposta:', errorText);
        
        // Tenta uma abordagem alternativa se der timeout
        if (response.status === 500 && errorText.includes('timeout')) {
          console.log('⏰ Timeout detectado, tentando abordagem alternativa...');
          
          // Tenta uma consulta ainda mais leve
          return await tryAlternativeQuery();
        }
        
        if (response.status === 401) {
          throw new Error('Não autorizado. Verifique a chave do Supabase.');
        } else if (response.status === 404) {
          throw new Error('View vw_reurb_surveys_admin não encontrada.');
        } else {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
      }
      
      const result = await response.json();
      console.log(`✅ ${result.length} registros carregados`);
      
      if (result.length > 0) {
        console.log('📋 Primeiro registro (apenas campos da grid):', {
          id: result[0].id,
          formulario: result[0].formulario,
          projeto: result[0].projeto,
          quadra: result[0].quadra,
          lote: result[0].lote,
          requerente: result[0].requerente,
          cpf: result[0].cpf
        });
      }
      
      // Formatar os dados
      const formattedData = result.map((item: any) => ({
        id: String(item.id || ''),
        Formulario: item.formulario ? String(item.formulario) : '-',
        Projeto: item.projeto ? String(item.projeto) : '-',
        Quadra: item.quadra ? String(item.quadra) : '-',
        Lote: item.lote ? String(item.lote) : '-',
        Requerente: item.requerente ? String(item.requerente) : '-',
        CPF: item.cpf ? String(item.cpf) : '-'
      }));
      
      // Filtrar por projeto se especificado
      let filteredData = formattedData;
      if (projectId) {
        filteredData = formattedData.filter((item: SurveyAdmin) => 
          item.Projeto && item.Projeto.toString().includes(projectId)
        );
      }
      
      setData(filteredData);
      
    } catch (err: any) {
      console.error('💥 Erro ao carregar dados:', err);
      setError(err.message || 'Erro desconhecido ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Abordagem alternativa para consulta
  const tryAlternativeQuery = async () => {
    console.log('🔄 Tentando consulta alternativa...');
    
    try {
      // Tenta uma consulta ainda mais simples
      let url = `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin`;
      
      const params = new URLSearchParams();
      params.append('select', 'id,projeto,quadra,lote');
      params.append('order', 'id.desc');
      params.append('limit', '100');
      
      url = `${url}?${params.toString()}`;
      
      console.log('🌐 URL da consulta alternativa:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Consulta alternativa falhou: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ ${result.length} registros carregados (alternativa)`);
      
      // Como não temos todos os campos, preenchemos com placeholders
      const formattedData = result.map((item: any) => ({
        id: String(item.id || ''),
        Formulario: 'N/A', // Não disponível nesta consulta
        Projeto: item.projeto ? String(item.projeto) : '-',
        Quadra: item.quadra ? String(item.quadra) : '-',
        Lote: item.lote ? String(item.lote) : '-',
        Requerente: 'N/A', // Não disponível nesta consulta
        CPF: 'N/A' // Não disponível nesta consulta
      }));
      
      setData(formattedData);
      
      // Mostra aviso
      setError('⚠️ Dados limitados carregados (alguns campos não disponíveis devido a limitações de performance)');
      
    } catch (altErr: any) {
      throw new Error(`Falha na consulta alternativa: ${altErr.message}`);
    }
  };

  // Carregar dados quando o componente montar
  useEffect(() => {
    fetchSurveyData();
  }, [projectId]);

  // Filtro de pesquisa no frontend
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

  // Navegação de páginas
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Relatórios de Vistorias
        </h2>
        
        <div className="text-sm text-gray-600">
          {loading ? 'Carregando...' : `${filtered.length} registro(s)`}
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
        
        {search && (
          <div className="mt-2 text-sm text-gray-500">
            {filtered.length} resultado(s) encontrado(s)
          </div>
        )}
      </div>
      
      {/* Mensagem de Erro */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Aviso</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <p className="text-sm text-gray-600 mt-2">
                Para melhorar performance, considere criar uma view otimizada no Supabase 
                com apenas os campos necessários para a grid.
              </p>
            </div>
            <button
              onClick={fetchSurveyData}
              className="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
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
                    {row.id.length > 20 ? `${row.id.substring(0, 20)}...` : row.id}
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
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        console.log('📋 ID da vistoria para PDF:', row.id);
                        onSelect(row.id); // MUDADO: passa apenas o ID
                      }}
                      disabled={loading}
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
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filtered.length)} de {filtered.length} registros
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2">...</span>
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
      
      {/* Botão de recarregar se houver erro */}
      {error && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={fetchSurveyData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Recarregar dados
          </button>
        </div>
      )}
    </div>
  );
};

export default SurveyAdminGrid;