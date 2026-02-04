import React, { useState, useEffect } from 'react';
import { Search, Printer, FileText } from 'lucide-react';

interface SurveyAdmin {
  id: string;
  formulario: string;
  projeto: string;
  quadra: string;
  lote: string;
  requerente: string;
  cpf: string;
}

interface SurveyAdminGridProps {
  onSelect: (surveyData: SurveyAdmin) => void;
  printedIds: string[];
}

const SurveyAdminGrid: React.FC<SurveyAdminGridProps> = ({ onSelect, printedIds }) => {
  const [data, setData] = useState<SurveyAdmin[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Consulta Supabase
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

  // Cálculos de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
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
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
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
            ) : currentItems.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8">Nenhum registro encontrado</td></tr>
            ) : (
              currentItems.map(row => (
                <tr key={row.id}
                  className={
                    printedIds.includes(row.id)
                      ? 'bg-green-50 hover:bg-green-100'
                      : 'hover:bg-gray-50'
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
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      onClick={() => onSelect(row)}
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
        <div className="flex items-center justify-between mt-4 px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-lg ${currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            >
              ← Anterior
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
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-1 rounded-lg ${currentPage === pageNum 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-lg ${currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyAdminGrid;