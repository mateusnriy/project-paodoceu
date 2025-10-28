import { useState } from 'react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { Categoria, Produto } from '../../types';
import { formatarMoeda, formatarData } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { ProductFormModal } from './components/ProductFormModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
// import { Pencil, Trash2, Plus, Search } from 'lucide-react';

// Novo componente para ajuste rápido
const QuickStockAdjust: React.FC<{
  produto: Produto;
  onSave: (id: string, novaQuantidade: number) => void;
}> = ({ produto, onSave }) => {
  const [estoqueLocal, setEstoqueLocal] = useState(produto.estoque);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(produto.id, Number(estoqueLocal));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEstoqueLocal(produto.estoque);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={estoqueLocal}
          onChange={(e) => setEstoqueLocal(Number(e.target.value))}
          onKeyDown={handleKeyDown}
          onBlur={handleSave} // Salva ao perder o foco
          className="w-20 px-2 py-1 border rounded-md"
          autoFocus
        />
        {/* <Button variant="ghost" size="sm" onClick={handleSave}>OK</Button> */}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 cursor-pointer group"
      onClick={() => setIsEditing(true)}
    >
      <span>{produto.estoque}</span>
      <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* <Pencil size={14} /> */} (E)
      </span>
    </div>
  );
};


const ProductsTable: React.FC<{
  produtos: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, novaQuantidade: number) => void; // <--- NOVA PROP
}> = ({ produtos, onEdit, onDelete, onAdjustStock }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque (Ajuste Rápido)</th> {/* <--- TÍTULO ATUALIZADO */}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {produtos.map((produto) => (
            <tr key={produto.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700">{produto.categoria?.nome || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700">{formatarMoeda(produto.preco)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {/* --- USAR NOVO COMPONENTE --- */}
                <QuickStockAdjust 
                  produto={produto} 
                  onSave={onAdjustStock} 
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  produto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {produto.ativo ? 'Sim' : 'Não'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(produto)}>
                  {/* <Pencil size={16} /> */} Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(produto.id)}>
                  {/* <Trash2 size={16} /> */} Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// Componente principal (AdminProducts)
export default function AdminProducts() {
  const {
    data: produtos,
    meta,
    isLoading,
    error,
    isMutating,
    setPagina,
    setTermoBusca,
    termoBusca,
    fetchData,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAdjustStock, // <--- OBTER FUNÇÃO
  } = useAdminProducts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoEdit, setProdutoEdit] = useState<Produto | null>(null);
  
  // (Lógica de Modal e Paginação - omitida para brevidade)
  const handleOpenModal = (produto: Produto | null = null) => { /* ... */ };
  const handleCloseModal = () => { /* ... */ };
  const handleSave = async (data: any) => { /* ... */ };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Produtos</h1>
        <Button onClick={() => handleOpenModal(null)}>
          {/* <Plus size={18} /> */} Novo Produto
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
        {/* <Search size={20} className="absolute left-3 top-2.5 text-gray-400" /> */}
      </div>
      
      {error && <ErrorMessage message={error} />}

      {isLoading && <SkeletonTable columns={6} rows={5} />}

      {!isLoading && !error && (
        <ProductsTable
          produtos={produtos}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onAdjustStock={handleAdjustStock} // <--- PASSAR PROP
        />
      )}

      {/* Paginação (omitida para brevidade) */}
      {/* <Pagination meta={meta} onPageChange={setPagina} /> */}

      {isModalOpen && (
        <ProductFormModal
          produto={produtoEdit}
          onClose={handleCloseModal}
          onSave={handleSave}
          isMutating={isMutating}
          // (Necessário buscar categorias para o modal)
          categorias={[]} 
        />
      )}
    </div>
  );
}
