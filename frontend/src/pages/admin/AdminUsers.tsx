// src/pages/admin/AdminUsers.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Usuario, PerfilUsuario, UsuarioFormData } from '../../types'; // PaginatedResponse removido
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { UserFormModal } from './components/UserFormModal';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatarData } from '../../utils/formatters';

// --- Componente de Paginação (Reutilizado - Memoizado) ---
interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}
const Pagination: React.FC<PaginationProps> = React.memo(
  ({ paginaAtual, totalPaginas, onPageChange, isLoading }) => {
    if (totalPaginas <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(paginaAtual - 1)} disabled={paginaAtual === 1 || isLoading} aria-label="Página anterior">
          Anterior
        </Button>
        <span className="text-sm text-text-secondary font-medium">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(paginaAtual + 1)} disabled={paginaAtual === totalPaginas || isLoading} aria-label="Próxima página">
          Próxima
        </Button>
      </div>
    );
  }
);
Pagination.displayName = 'Pagination';

// --- Tabela de Usuários (Memoizado) ---
const UsersTable: React.FC<{
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  idUsuarioLogado?: string;
}> = React.memo(({ usuarios, onEdit, onDelete, isLoading, idUsuarioLogado }) => {
   const PerfilBadge: React.FC<{ perfil: PerfilUsuario }> = ({ perfil }) => (
    <span
      className={`
        inline-block px-3 py-1 text-xs font-semibold rounded-full leading-tight
        ${
          perfil === PerfilUsuario.ADMINISTRADOR
            ? 'bg-primary-blue/20 text-primary-blue'
            : 'bg-gray-200 text-text-secondary'
        }
      `}
    >
      {perfil ? perfil.charAt(0) + perfil.slice(1).toLowerCase() : 'N/A'}
    </span>
  );
  PerfilBadge.displayName = 'PerfilBadge';

  return (
    <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Nome
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Perfil
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Criado em
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {isLoading && !usuarios.length ? (
            <SkeletonTable cols={5} rows={5} />
          ) : (
            usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-background-light-blue transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                  {usuario.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {usuario.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  <PerfilBadge perfil={usuario.perfil} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                   {/* CORREÇÃO: Usar criado_em */}
                  {usuario.criado_em ? formatarData(usuario.criado_em, { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onEdit(usuario)}
                    aria-label={`Editar ${usuario.nome}`}
                    className="text-primary-blue hover:underline p-1"
                    title="Editar"
                     disabled={isLoading}
                  >
                    <Edit size={16} />
                  </Button>
                  {idUsuarioLogado && usuario.id !== idUsuarioLogado && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onDelete(usuario.id)}
                      className="text-status-error hover:underline p-1"
                      aria-label={`Excluir ${usuario.nome}`}
                      title="Excluir"
                       disabled={isLoading}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
          {!isLoading && usuarios.length === 0 && (
             <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-text-secondary">
                    Nenhum usuário encontrado.
                </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
UsersTable.displayName = 'UsersTable';

// --- Página Principal: AdminUsers ---
const AdminUsers: React.FC = () => {
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);

  const termoDebounced = useDebounce(termoBusca, 300);

  const {
    data,
    isLoading,
    error,
    mutate,
    handleCreate,
    handleUpdate,
    handleDelete,
    isMutating,
    mutationError,
    setMutationError,
    idUsuarioLogado,
  } = useAdminUsers(pagina, termoDebounced);

  const usuarios = data?.data ?? [];

  const totalPaginas = useMemo(() => {
    if (!data) return 1;
    // CORREÇÃO: Acessando data.meta
    const totalItems = data.meta?.total ?? 0;
    const itemsPerPage = data.meta?.limit ?? 10;
    return Math.ceil(totalItems / itemsPerPage) || 1;
  }, [data]);

  const handleOpenModal = useCallback((usuario: Usuario | null) => {
    setUsuarioSelecionado(usuario);
    setMutationError(null);
    setModalAberto(true);
  }, [setMutationError]);

  const handleCloseModal = useCallback(() => {
    setUsuarioSelecionado(null);
    setModalAberto(false);
  }, []);

  const handleSave = useCallback(async (formData: UsuarioFormData, id?: string): Promise<Usuario | void> => {
    try {
      let result: Usuario;
      if (id) {
        result = await handleUpdate(id, formData);
      } else {
        result = await handleCreate(formData);
      }
      handleCloseModal();
      mutate();
      return result;
    } catch (err) {
      throw err; // O erro será pego e tratado pelo modal
    }
  }, [handleCreate, handleUpdate, mutate, handleCloseModal]);


  const handleDeleteConfirm = useCallback(async (id: string) => {
    const usuarioParaExcluir = usuarios.find(u => u.id === id);
     if (id === idUsuarioLogado) {
         alert('Você não pode excluir seu próprio usuário.');
         return;
     }
     if (window.confirm(`Tem certeza que deseja excluir o usuário "${usuarioParaExcluir?.nome}"?`)) {
      try {
        await handleDelete(id);
         if (usuarios.length === 1 && pagina > 1) {
            setPagina(pagina - 1);
         } else {
            mutate();
         }
      } catch (err) {
        alert(`Erro ao excluir usuário: ${getErrorMessage(err)}`);
      }
    }
  }, [handleDelete, mutate, usuarios, pagina, idUsuarioLogado]);

  const handlePageChange = useCallback((newPage: number) => {
    if(newPage >= 1 && newPage <= totalPaginas) {
      setPagina(newPage);
    }
  }, [totalPaginas]);

  useEffect(() => {
      setPagina(1);
  }, [termoDebounced]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Usuários</h1>
        <Button
          variant="primary"
          onClick={() => handleOpenModal(null)}
          disabled={isLoading || isMutating}
        >
          <Plus size={20} className="-ml-1 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <Search size={20} className="text-text-secondary" aria-hidden="true" />
        </div>
        <input
          type="search"
          placeholder="Buscar usuários por nome ou email..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          disabled={isMutating}
          className="
            block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
            leading-5 bg-primary-white text-text-primary placeholder-gray-500
            focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
            sm:text-sm
          "
        />
      </div>

      {error && !isLoading && (
        <ErrorMessage message={getErrorMessage(error)} />
      )}

      <UsersTable
        usuarios={usuarios}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        isLoading={isLoading || isMutating}
        idUsuarioLogado={idUsuarioLogado}
      />

      <Pagination
        paginaAtual={pagina}
        totalPaginas={totalPaginas}
        onPageChange={handlePageChange}
        isLoading={isLoading || isMutating}
      />

      {modalAberto && (
        <UserFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave}
          usuario={usuarioSelecionado}
          isLoading={isMutating}
          error={mutationError} // Passa o erro original
        />
      )}
    </div>
  );
};

export default AdminUsers;
