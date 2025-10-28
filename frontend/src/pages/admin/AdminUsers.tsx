// src/pages/admin/AdminUsers.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Usuario, PerfilUsuario, UsuarioFormData } from '../../types';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { UserFormModal } from './components/UserFormModal';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatarData } from '../../utils/formatters';
import { Pagination } from '../../components/ui/Pagination'; // <<< Importar Pagination

// --- Tabela de Usuários (Memoizado - sem alterações no código interno) ---
const UsersTable: React.FC<{
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  idUsuarioLogado?: string; // ID do usuário logado para prevenir auto-exclusão
}> = React.memo(({ usuarios, onEdit, onDelete, isLoading, idUsuarioLogado }) => {
   const PerfilBadge: React.FC<{ perfil: PerfilUsuario }> = ({ perfil }) => (
    <span
      className={`
        inline-block px-3 py-1 text-xs font-semibold rounded-full leading-tight
        ${
          perfil === PerfilUsuario.ADMINISTRADOR
            ? 'bg-primary-blue/20 text-primary-blue' // Fundo/texto azul para Admin
            : 'bg-gray-200 text-text-secondary' // Fundo/texto cinza para Atendente
        }
      `}
    >
      {/* Capitaliza a primeira letra */}
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
          {/* Mostra Skeleton se carregando E ainda não tem dados */}
          {isLoading && !usuarios.length ? (
            <SkeletonTable cols={5} rows={5} />
          ) : (
            usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-background-light-blue transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                  {usuario.nome} {usuario.id === idUsuarioLogado ? '(Você)' : ''} {/* Identifica usuário logado */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {usuario.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  <PerfilBadge perfil={usuario.perfil} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {/* Formata a data de criação */}
                  {usuario.criado_em ? formatarData(usuario.criado_em, { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {/* Botão Editar */}
                  <Button
                    variant="link" // Usar link para ações de tabela
                    size="sm"
                    onClick={() => onEdit(usuario)}
                    aria-label={`Editar ${usuario.nome}`}
                    className="text-primary-blue hover:underline p-1" // Ajustar padding
                    title="Editar"
                    disabled={isLoading} // Desabilitar durante carregamento/mutação
                  >
                    <Edit size={16} />
                  </Button>
                  {/* Botão Excluir (condicional) */}
                  {idUsuarioLogado && usuario.id !== idUsuarioLogado && ( // Só mostra se não for o usuário logado
                    <Button
                      variant="link" // Usar link
                      size="sm"
                      onClick={() => onDelete(usuario.id)}
                      className="text-status-error hover:underline p-1" // Cor de erro
                      aria-label={`Excluir ${usuario.nome}`}
                      title="Excluir"
                      disabled={isLoading} // Desabilitar durante carregamento/mutação
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
          {/* Mensagem se não houver usuários e não estiver carregando */}
          {!isLoading && usuarios.length === 0 && (
             <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-text-secondary">
                    Nenhum usuário encontrado com os filtros atuais.
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

  // Debounce no termo de busca para evitar chamadas API excessivas
  const termoDebounced = useDebounce(termoBusca, 300);

  // Hook customizado para gerenciar dados e mutações de usuários
  const {
    data, // Resposta paginada { data: Usuario[], meta: ApiMeta }
    isLoading, // Estado de carregamento da busca
    error, // Erro geral de carregamento (unknown)
    mutate, // Função para revalidar/rebuscar os dados
    handleCreate, // Função para criar usuário
    handleUpdate, // Função para atualizar usuário
    handleDelete, // Função para deletar usuário
    isMutating, // Estado de carregamento das operações CUD
    mutationError, // Erro específico das operações CUD (unknown)
    setMutationError, // Função para limpar o erro de mutação
    idUsuarioLogado, // ID do usuário atualmente logado
  } = useAdminUsers(pagina, termoDebounced);

  // Extrai a lista de usuários e metadados de paginação
  const usuarios = data?.data ?? [];
  const meta = data?.meta;

  // Calcula o total de páginas (memoizado)
  const totalPaginas = useMemo(() => {
    if (!meta) return 1;
    return meta.totalPaginas || 1;
  }, [meta]);

  // Funções para controlar o modal
  const handleOpenModal = useCallback((usuario: Usuario | null) => {
    setUsuarioSelecionado(usuario);
    setMutationError(null); // Limpa erro anterior ao abrir
    setModalAberto(true);
  }, [setMutationError]);

  const handleCloseModal = useCallback(() => {
    setUsuarioSelecionado(null);
    setModalAberto(false);
  }, []);

  // Função chamada pelo modal ao salvar (criar ou editar)
  const handleSave = useCallback(async (formData: UsuarioFormData, id?: string): Promise<void> => {
    try {
      if (id) {
        await handleUpdate(id, formData);
      } else {
        await handleCreate(formData);
      }
      handleCloseModal();
      mutate(); // Revalida os dados após salvar
      // Opcional: Adicionar toast de sucesso
    } catch (err) {
      // O erro já foi capturado no hook e será passado para o modal via `mutationError`
      console.error("Erro no handleSave (AdminUsers):", err);
      // Não precisa re-lançar, pois o modal exibirá o `mutationError`
    }
  }, [handleCreate, handleUpdate, mutate, handleCloseModal]);


  // Função chamada ao confirmar a exclusão de um usuário
  const handleDeleteConfirm = useCallback(async (id: string) => {
    const usuarioParaExcluir = usuarios.find(u => u.id === id);
     if (!usuarioParaExcluir) return;

     // Prevenção de auto-exclusão
     if (id === idUsuarioLogado) {
         alert('Você não pode excluir seu próprio usuário.');
         return;
     }

     if (window.confirm(`Tem certeza que deseja excluir o usuário "${usuarioParaExcluir.nome}" (${usuarioParaExcluir.email})? Esta ação não pode ser desfeita.`)) {
      try {
        await handleDelete(id);
        // Se a página atual ficar vazia e não for a primeira, volta uma página
         if (usuarios.length === 1 && pagina > 1) {
            setPagina(pagina - 1); // O useEffect [pagina] buscará os dados
         } else {
            mutate(); // Revalida a página atual
         }
         // Opcional: Adicionar toast de sucesso
      } catch (err) {
        // Exibe erro específico retornado pelo hook
        alert(`Erro ao excluir usuário: ${getErrorMessage(err)}`);
      }
    }
  }, [handleDelete, mutate, usuarios, pagina, idUsuarioLogado]);

  // Navega entre as páginas
  const handlePageChange = useCallback((newPage: number) => {
    // A validação já existe no componente Pagination, mas é bom ter aqui também
    if (newPage >= 1 && newPage <= totalPaginas) {
      setPagina(newPage);
    }
  }, [totalPaginas]);

  // Volta para a página 1 quando o termo de busca muda
  useEffect(() => {
      setPagina(1);
  }, [termoDebounced]);

  // Converte erro geral (unknown) para string ou null para exibição
  const displayError = error ? getErrorMessage(error) : null;

  return (
    <div className="space-y-6"> {/* Espaçamento vertical entre elementos */}
      {/* Cabeçalho: Título e Botão Novo Usuário */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Usuários</h1>
        <Button
          variant="primary"
          onClick={() => handleOpenModal(null)}
          disabled={isLoading || isMutating} // Desabilitar se carregando dados ou salvando/excluindo
        >
          <Plus size={20} className="-ml-1 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <Search size={20} className="text-text-secondary" aria-hidden="true" />
        </div>
        <input
          type="search" // Tipo search para UX
          placeholder="Buscar usuários por nome ou email..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          disabled={isMutating} // Desabilitar durante CUD
          className="
            block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
            leading-5 bg-primary-white text-text-primary placeholder-text-secondary/70
            focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
            sm:text-sm transition-colors duration-150
          "
        />
      </div>

      {/* Mensagem de Erro Geral (apenas se não estiver carregando) */}
      {displayError && !isLoading && (
        <ErrorMessage message={displayError} title="Erro ao Carregar Usuários" />
      )}

      {/* Tabela de Usuários */}
      <UsersTable
        usuarios={usuarios}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        // Passa isLoading OU isMutating para mostrar skeleton/desabilitar botões
        isLoading={isLoading || isMutating}
        idUsuarioLogado={idUsuarioLogado}
      />

      {/* Paginação (só mostra se houver metadados) */}
      {meta && (
        <Pagination
          paginaAtual={meta.pagina}
          totalPaginas={totalPaginas}
          onPageChange={handlePageChange}
          isLoading={isLoading || isMutating} // Desabilitar botões durante CUD
        />
      )}


      {/* Modal de Formulário (renderização condicional) */}
      {modalAberto && (
        <UserFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave}
          usuario={usuarioSelecionado}
          isLoading={isMutating} // Passa estado de carregamento CUD para o modal
          error={mutationError} // Passa erro CUD (unknown) para o modal exibir
        />
      )}
    </div>
  );
};

export default AdminUsers;
