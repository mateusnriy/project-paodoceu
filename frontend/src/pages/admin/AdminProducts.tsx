// mateusnriy/project-paodoceu/project-paodoceu-main/frontend/src/pages/admin/AdminProducts.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Categoria, Produto, ProdutoFormData, PaginatedResponse } from '../../types';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ProductFormModal } from './components/ProductFormModal';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatarMoeda, formatarData } from '../../utils/formatters';

// --- Componente de Tabela de Produtos (Memoizado) ---
const ProductsTable: React.FC<{ /* ... props ... */ }> = React.memo(({ /* ... */ }) => {
    // ... (implementação mantida igual)
     const { produtos, onEdit, onDelete, isLoading } = arguments[0];
     const StatusBadge: React.FC<{ disponivel: boolean }> = ({ disponivel }) => (
        <span
        className={`
            inline-block px-3 py-1 text-xs font-semibold rounded-full leading-tight
            ${
            disponivel
                ? 'bg-status-success-bg text-status-success-text'
                : 'bg-status-disabled-bg text-status-disabled-text'
            }
        `}
        >
        {disponivel ? 'Disponível' : 'Indisponível'}
        </span>
     );
     StatusBadge.displayName = 'StatusBadge';

     return (
        <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Preço
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Estoque
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Categoria
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && !produtos.length ? (
                 <SkeletonTable cols={6} rows={5} />
              ) : (
                produtos.map((produto) => (
                  <tr key={produto.id} className="hover:bg-background-light-blue transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {produto.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      <StatusBadge disponivel={produto.quantidadeEstoque > 0} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {formatarMoeda(produto.preco)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {produto.quantidadeEstoque}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {produto.categoria?.nome ?? 'Sem categoria'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onEdit(produto)}
                        aria-label={`Editar ${produto.nome}`}
                        className="text-primary-blue hover:underline p-1"
                        title="Editar"
                        disabled={isLoading}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onDelete(produto.id)}
                        className="text-status-error hover:underline p-1"
                        aria-label={`Excluir ${produto.nome}`}
                        title="Excluir"
                         disabled={isLoading}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && produtos.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-text-secondary">
                          Nenhum produto encontrado.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      );
});
ProductsTable.displayName = 'ProductsTable';

// --- Componente de Paginação (Memoizado) ---
const Pagination: React.FC<{
  paginaAtual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}> = React.memo(({ paginaAtual, totalPaginas, onPageChange, isLoading }) => {
    // ... (implementação mantida igual)
    if (totalPaginas <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(paginaAtual - 1)}
          disabled={paginaAtual === 1 || isLoading}
          aria-label="Página anterior"
        >
          Anterior
        </Button>
        <span className="text-sm text-text-secondary font-medium">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas || isLoading}
          aria-label="Próxima página"
        >
          Próxima
        </Button>
      </div>
    );
});
Pagination.displayName = 'Pagination';

// --- Página Principal: AdminProducts ---
const AdminProducts: React.FC = () => {
  const [pagina, setPagina] = useState(1
    