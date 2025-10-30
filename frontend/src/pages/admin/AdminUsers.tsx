// frontend/src/pages/admin/AdminUsers.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Usuario, PerfilUsuario, UsuarioFormData } from '../../types';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { UserFormModal } from './components/UserFormModal';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatarData } from '../../utils/formatters';
import { Pagination } from '../../components/ui/Pagination';

// --- (Componente PerfilBadge Interno) ---
const PerfilBadge: React.FC<{ perfil: PerfilUsuario }> = ({ perfil }) => {
  const classes = {
    [PerfilUsuario.MASTER]: 'bg-gray-700 text-white',
    [PerfilUsuario.ADMINISTRADOR]: 'bg-primary-blue/20 text-primary-blue',
    [PerfilUsuario.ATENDENTE]: 'bg-gray-200 text-text-secondary',
  };
  const nomes = {
    [PerfilUsuario.MASTER]: 'Master',
    [PerfilUsuario.ADMINISTRADOR]: 'Admin',
    [PerfilUsuario.ATENDENTE]: 'Atendente',
  };
  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${
        classes[perfil] || classes[PerfilUsuario.ATENDENTE]
      }`}
    >
      {nomes[perfil] || 'N/A'}
    </span>
  );
};

// --- Tabela de Usuários ---
const UsersTable: React.FC<{
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  idUsuarioLogado?: string;
  perfilUsuarioLogado?: PerfilUsuario;
}> = React.memo(
  ({
    usuarios,
    onEdit,
    onDelete,
    isLoading,
    idUsuarioLogado,
    perfilUsuarioLogado,
  }) => {
    const canManageTarget = (targetProfile: PerfilUsuario) => {
      if (!perfilUsuarioLogado) return false;
      if (perfilUsuarioLogado === PerfilUsuario.MASTER) return true;
      if (perfilUsuarioLogado === PerfilUsuario.ADMINISTRADOR) {
        return targetProfile === PerfilUsuario.ATENDENTE;
      }
      return false;
    };

    return (
      <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Nome</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Perfil</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Ativo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Criado em</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading && !usuarios.length ? (
              <SkeletonTable cols={6} rows={5} />
            ) : (
              usuarios.map((usuario) => {
                const isSelf = usuario.id === idUsuarioLogado;
                const canManage = !isSelf && canManageTarget(usuario.perfil);

                return (
                  <tr
                    key={usuario.id}
                    className="hover:bg-background-light-blue transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {usuario.nome}
                      {isSelf && (
                        <span className="ml-2 text-xs text-primary-blue font-normal">
                          (Você)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {usuario.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PerfilBadge perfil={usuario.perfil} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          usuario.ativo
                            ? 'bg-status-success-bg text-status-success-text'
                            : 'bg-status-error-bg text-status-error-text'
                        }`}
                      >
                        {usuario.ativo ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {formatarData(usuario.criado_em, { dateStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 text-right">
                      {canManage && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => onEdit(usuario)}
                          disabled={isLoading}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => onDelete(usuario.id)}
                          className="text-status-error"
                          disabled={isLoading}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                      {!canManage && !isSelf && (
                        <span className="text-xs text-gray-400 italic">
                          Sem permissão
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            {!isLoading && usuarios.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-text-secondary"
                >
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  },
);
UsersTable.displayName = 'UsersTable';

// --- Página Principal: AdminUsers ---
const AdminUsers: React.FC = () => {
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(
    null,
  );
  const termoDebounced = useDebounce(termoBusca, 300);
  const { usuario: usuarioLogado } = useAuth();

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
  const meta = data?.meta;
  const totalPaginas = meta?.totalPaginas || 1;

  const handleOpenModal = useCallback(
    (usuario: Usuario | null) => {
      if (
        usuario &&
        usuarioLogado?.perfil === PerfilUsuario.ADMINISTRADOR &&
        usuario.perfil !== PerfilUsuario.ATENDENTE
      ) {
        toast.error('Administradores só podem editar Atendentes.');
        return;
      }
      setUsuarioSelecionado(usuario);
      setMutationError(null);
      setModalAberto(true);
    },
    [setMutationError, usuarioLogado?.perfil],
  );

  const handleCloseModal = useCallback(() => {
    setUsuarioSelecionado(null);
    setModalAberto(false);
  }, []);

  const handleSave = useCallback(
    // CORREÇÃO (Erro 18): 'formData' deve ser 'Partial' para
    // corresponder ao que o UserFormModal envia.
    async (formData: Partial<UsuarioFormData>, id?: string): Promise<void> => {
      try {
        if (id) {
          await handleUpdate(id, formData);
        } else {
          // Na criação, o hook/service espera o tipo completo
          await handleCreate(formData as UsuarioFormData);
        }
        handleCloseModal();
        mutate();
      } catch (err) {
        // Erro já tratado no hook (exibe toast)
        console.error('Erro no handleSave (AdminUsers):', err);
      }
    },
    [handleCreate, handleUpdate, handleCloseModal, mutate],
  );

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      // CORREÇÃO (Erro 17): Adicionar tipo explícito 'u: Usuario'
      // para ajudar na inferência de 'usuarios'.
      const usuarioParaExcluir = usuarios.find((u: Usuario) => u.id === id);
      if (!usuarioParaExcluir) return;

      if (
        usuarioLogado?.perfil === PerfilUsuario.ADMINISTRADOR &&
        usuarioParaExcluir.perfil !== PerfilUsuario.ATENDENTE
      ) {
        toast.error('Administradores só podem excluir Atendentes.');
        return;
      }

      if (
        window.confirm(
          `Tem certeza que deseja excluir "${usuarioParaExcluir.nome}"?`,
        )
      ) {
        try {
          await handleDelete(id);
          if (usuarios.length === 1 && pagina > 1) {
            setPagina(pagina - 1);
          } else {
            mutate();
          }
        } catch (err) {
          // Erro já tratado pelo hook
        }
      }
    },
    [handleDelete, usuarios, pagina, usuarioLogado?.perfil, mutate],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPaginas) setPagina(newPage);
    },
    [totalPaginas],
  );

  useEffect(() => {
    setPagina(1);
  }, [termoDebounced]);

  const displayError = error ? getErrorMessage(error) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">
          Gestão de Usuários
        </h1>
        {(usuarioLogado?.perfil === PerfilUsuario.MASTER ||
          usuarioLogado?.perfil === PerfilUsuario.ADMINISTRADOR) && (
          <Button
            variant="primary"
            onClick={() => handleOpenModal(null)}
            disabled={isLoading || isMutating}
          >
            <Plus size={20} className="-ml-1 mr-2" /> Novo Usuário
          </Button>
        )}
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
            leading-5 bg-primary-white text-text-primary placeholder-text-secondary/70
            focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
            sm:text-sm transition-colors duration-150
          "
        />
      </div>

      {displayError && !isLoading && <ErrorMessage message={displayError} />}

      <UsersTable
        usuarios={usuarios}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        isLoading={isLoading || isMutating}
        idUsuarioLogado={idUsuarioLogado}
        perfilUsuarioLogado={usuarioLogado?.perfil}
      />

      {meta && (
        <Pagination
          paginaAtual={meta.pagina}
          totalPaginas={totalPaginas}
          onPageChange={handlePageChange}
          isLoading={isLoading || isMutating}
        />
      )}

      {modalAberto && (
        <UserFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSubmit={handleSave}
          usuario={usuarioSelecionado}
          isLoading={isMutating}
          error={mutationError}
          perfilUsuarioLogado={usuarioLogado?.perfil}
        />
      )}
    </div>
  );
};

export default AdminUsers;
