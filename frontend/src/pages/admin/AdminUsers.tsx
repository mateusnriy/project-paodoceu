import React from 'react';
import { Button } from '../../components/common/Button';
import { PlusIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'; // Ícones paginação
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { UserFormModal } from './components/UserFormModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { SkeletonTable } from '../../components/ui/SkeletonTable'; // Import Skeleton

const AdminUsers: React.FC = () => {
  const {
    isLoading,
    error,
    users, // Lista paginada
    modalState,
    handleOpenModal,
    handleCloseModal,
    handleSaveUser,
    handleDeleteUser,
    // Paginação
    currentPage,
    totalPages,
    setCurrentPage,
  } = useAdminUsers();

  // Componente interno para paginação
  const PaginationControls = () => {
    // Não mostra se só há uma página ou no carregamento inicial
    if (totalPages <= 1 || (isLoading && users.length === 0)) return null;

    return (
      <div className="mt-6 flex items-center justify-center gap-4">
        {/* Desabilita botões durante qualquer carregamento */}
        <Button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          variant="outlined"
          className="px-4 py-2"
          aria-label="Página anterior"
        >
          <ChevronLeftIcon size={18} /> <span className="ml-1 hidden sm:inline">Anterior</span>
        </Button>
        <span className="text-gray-600">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          variant="outlined"
          className="px-4 py-2"
          aria-label="Próxima página"
        >
          <span className="mr-1 hidden sm:inline">Próxima</span> <ChevronRightIcon size={18} />
        </Button>
      </div>
    );
  };

  const renderTableContent = () => {
    // Skeleton no carregamento inicial absoluto
    if (isLoading && users.length === 0) {
      // Ajustar número de colunas para Usuário (5 cols)
      return <SkeletonTable rows={5} cols={5} />;
    }
    // Mensagem se não houver usuários
    if (users.length === 0 && !isLoading) {
      return <div className="text-center py-10 text-gray-500">Nenhum usuário encontrado.</div>;
    }
    // Tabela normal
    return (
      <table className="min-w-full divide-y divide-gray-200 relative">
        {' '}
        {/* Adicionado relative */}
        {/* Overlay de Loading para troca de página */}
        {isLoading && users.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-b-4xl">
            {' '}
            {/* Rounded bottom */}
            <LoadingSpinner size={32} />
          </div>
        )}
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Nome
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Email (Usuário)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Função
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${isLoading ? 'opacity-50' : ''}`}>
          {' '}
          {/* Opacidade durante loading */}
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.nome}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {user.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Atendente'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.ativo ? 'bg-success/20 text-success' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleOpenModal(user)}
                  className="text-accent hover:text-accent/70 mr-3 disabled:opacity-50"
                  disabled={isLoading} // Desabilita durante carregamento
                  aria-label={`Editar ${user.nome}`}
                >
                  <EditIcon size={18} />
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-error hover:text-error/70 disabled:opacity-50"
                  disabled={isLoading} // Desabilita durante carregamento
                  aria-label={`Excluir ${user.nome}`}
                >
                  <TrashIcon size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-accent">Usuários</h1>
        <Button
          onClick={() => handleOpenModal(null)}
          color="accent"
          disabled={isLoading && users.length === 0} // Desabilita no load inicial
        >
          <PlusIcon size={18} /> <span className="ml-2">Novo Usuário</span>
        </Button>
      </div>

      <div className="bg-white rounded-4xl shadow-soft p-6">
        <ErrorMessage message={error} />
        {/* Adicionado relative aqui */}
        <div className="overflow-x-auto relative">{renderTableContent()}</div>
        <PaginationControls /> {/* Controles de Paginação */}
      </div>

      {/* O onSubmit agora espera boolean, mas o modal trata internamente */}
      <UserFormModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveUser} // Passa a função do hook diretamente
        user={modalState.user}
      />
    </div>
  );
};

export default AdminUsers;
