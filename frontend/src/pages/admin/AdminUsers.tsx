// frontend/src/pages/admin/AdminUsers.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast'; // Correção B.1
import { Usuario, PerfilUsuario, UsuarioFormData } from '../../types'; // Tipos já corrigidos (A.1)
import { useAdminUsers } from '../../hooks/useAdminUsers'; // Hook já corrigido (B.2)
import { useAuth } from '../../contexts/AuthContext'; // Para obter perfil do ator
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { UserFormModal } from './components/UserFormModal'; // Modal já corrigido
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatarData } from '../../utils/formatters';
import { Pagination } from '../../components/ui/Pagination';

// Componente UsersTable (sem alterações significativas na lógica interna, apenas recebe props)
const UsersTable: React.FC<{
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  idUsuarioLogado?: string;
  perfilUsuarioLogado?: PerfilUsuario; // Correção A.4: Recebe perfil logado
}> = React.memo(({ usuarios, onEdit, onDelete, isLoading, idUsuarioLogado, perfilUsuarioLogado }) => {
   // ... (Componente PerfilBadge interno mantido) ...

   // Correção A.4: Determina se o usuário logado pode gerenciar o usuário alvo
   const canManageTarget = (targetProfile: PerfilUsuario) => {
       if (!perfilUsuarioLogado) return false; // Segurança
       if (perfilUsuarioLogado === PerfilUsuario.MASTER) return true; // Master pode tudo
       if (perfilUsuarioLogado === PerfilUsuario.ADMINISTRADOR) {
           return targetProfile === PerfilUsuario.ATENDENTE; // Admin só gerencia Atendente
       }
       return false;
   };

  return (
    <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        {/* thead mantido */}
        <tbody className="divide-y divide-gray-200">
          {/* Skeleton/Loading mantido */}
          {!isLoading && usuarios.length > 0 && usuarios.map((usuario) => {
             const isSelf = usuario.id === idUsuarioLogado;
             const canManage = !isSelf && canManageTarget(usuario.perfil); // Verifica permissão

             return (
              <tr key={usuario.id} className="hover:bg-background-light-blue transition-colors duration-150">
                {/* Colunas Nome, Email, Perfil, Criado em mantidas */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 text-right"> {/* Ações na direita */}
                  {/* Botão Editar (condicional) */}
                  {canManage && (
                    <Button variant="link" size="sm" onClick={() => onEdit(usuario)} disabled={isLoading} title="Editar"> <Edit size={16} /> </Button>
                  )}
                  {/* Botão Excluir (condicional) */}
                  {canManage && ( // Só mostra se puder gerenciar
                    <Button variant="link" size="sm" onClick={() => onDelete(usuario.id)} className="text-status-error" disabled={isLoading} title="Excluir"> <Trash2 size={16} /> </Button>
                  )}
                  {/* Indicação se não puder gerenciar */}
                  {!canManage && !isSelf && (
                      <span className="text-xs text-gray-400 italic">Sem permissão</span>
                  )}
                </td>
              </tr>
             );
           })}
          {/* Mensagem de 'Nenhum usuário' mantida */}
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
  const { usuario: usuarioLogado } = useAuth(); // Correção A.4: Obter usuário logado

  const {
    data, isLoading, error, mutate,
    handleCreate, handleUpdate, handleDelete,
    isMutating, mutationError, setMutationError,
    idUsuarioLogado, // Vem do hook
  } = useAdminUsers(pagina, termoDebounced);

  const usuarios = data?.data ?? [];
  const meta = data?.meta;
  const totalPaginas = meta?.totalPaginas || 1;

  const handleOpenModal = useCallback((usuario: Usuario | null) => {
    // Correção A.4: Validar permissão ANTES de abrir o modal de edição
    if (usuario && usuarioLogado?.perfil === PerfilUsuario.ADMINISTRADOR && usuario.perfil !== PerfilUsuario.ATENDENTE) {
        toast.error('Administradores só podem editar Atendentes.'); // Correção B.1
        return;
    }
    setUsuarioSelecionado(usuario);
    setMutationError(null);
    setModalAberto(true);
  }, [setMutationError, usuarioLogado?.perfil]);

  const handleCloseModal = useCallback(() => {
    setUsuarioSelecionado(null);
    setModalAberto(false);
  }, []);

  const handleSave = useCallback(async (formData: UsuarioFormData, id?: string): Promise<void> => {
    // A validação de permissão ocorre no backend e ao abrir o modal,
    // mas pode ser reforçada aqui se necessário.
    try {
      if (id) {
        await handleUpdate(id, formData); // Hook já usa service e mostra toast
      } else {
        await handleCreate(formData); // Hook já usa service e mostra toast
      }
      handleCloseModal();
      // mutate(); // Hook já faz isso internamente
    } catch (err) {
      // Erro já tratado e exibido via toast pelo hook
      console.error("Erro no handleSave (AdminUsers):", err);
    }
  }, [handleCreate, handleUpdate, handleCloseModal]);

  const handleDeleteConfirm = useCallback(async (id: string) => {
    const usuarioParaExcluir = usuarios.find(u => u.id === id);
    if (!usuarioParaExcluir) return;

    // Validação de permissão aqui também (redundante mas seguro)
    if (usuarioLogado?.perfil === PerfilUsuario.ADMINISTRADOR && usuarioParaExcluir.perfil !== PerfilUsuario.ATENDENTE) {
        toast.error('Administradores só podem excluir Atendentes.'); // Correção B.1
        return;
    }

    // Correção B.1: Usar confirm customizado ou toast com ação (complexo), mantendo window.confirm por simplicidade
    if (window.confirm(`Tem certeza que deseja excluir "${usuarioParaExcluir.nome}"?`)) {
      try {
        await handleDelete(id); // Hook já usa service e mostra toast
        // Lógica de paginação após delete mantida do hook original
      } catch (err) {
        // Erro já tratado e exibido via toast pelo hook
      }
    }
  }, [handleDelete, usuarios, pagina, usuarioLogado?.perfil]); // Adiciona perfil como dependência

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPaginas) setPagina(newPage);
  }, [totalPaginas]);

  useEffect(() => { setPagina(1); }, [termoDebounced]);

  const displayError = error ? getErrorMessage(error) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Usuários</h1>
        {/* Correção A.4: Botão "Novo Usuário" só aparece para Master ou Admin */}
        {(usuarioLogado?.perfil === PerfilUsuario.MASTER || usuarioLogado?.perfil === PerfilUsuario.ADMINISTRADOR) && (
          <Button variant="primary" onClick={() => handleOpenModal(null)} disabled={isLoading || isMutating}>
            <Plus size={20} className="-ml-1 mr-2" /> Novo Usuário
          </Button>
        )}
      </div>

      {/* Barra de Busca mantida */}
      <div className="relative"> ... </div>

      {displayError && !isLoading && <ErrorMessage message={displayError} />}

      <UsersTable
        usuarios={usuarios}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        isLoading={isLoading || isMutating} // Combina loadings
        idUsuarioLogado={idUsuarioLogado}
        perfilUsuarioLogado={usuarioLogado?.perfil} // Correção A.4: Passa perfil
      />

      {meta && <Pagination paginaAtual={meta.pagina} totalPaginas={totalPaginas} onPageChange={handlePageChange} isLoading={isLoading || isMutating} />}

      {modalAberto && (
        <UserFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave}
          usuario={usuarioSelecionado}
          isLoading={isMutating}
          error={mutationError} // Passa o erro original
          // Correção A.4: Passar perfil do usuário logado para o modal
          perfilUsuarioLogado={usuarioLogado?.perfil}
        />
      )}
    </div>
  );
};

export default AdminUsers;
