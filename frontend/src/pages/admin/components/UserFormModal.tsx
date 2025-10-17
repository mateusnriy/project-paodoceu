import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { User } from '../../../types'; // Barrel file
import { UserFormData } from '../../../hooks/useAdminUsers';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Correção: Espera Promise<boolean> agora
  onSubmit: (formData: UserFormData) => Promise<boolean>;
  user: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados dos campos
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<'ADMINISTRADOR' | 'ATENDENTE'>('ATENDENTE');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setNome(user?.nome || '');
      setEmail(user?.email || '');
      setSenha(''); // Limpa senha ao abrir
      setPerfil(user?.perfil || 'ATENDENTE');
      setAtivo(user?.ativo ?? true);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData: UserFormData = { nome, email, perfil, ativo, senha: senha || undefined }; // Envia undefined se senha for vazia

    try {
      const success = await onSubmit(formData); // onSubmit retorna boolean
      if (success) {
        onClose(); // Fecha apenas se for sucesso
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-4xl shadow-soft w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-accent mb-4">
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorMessage message={error} />
            {/* --- Campos do Formulário --- */}
            <div>
              <label className="block text-sm mb-1">Nome Completo</label>
              <input
                type="text"
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Email (Nome de Usuário)</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Senha {user ? '(Deixe em branco para manter)' : ''}
              </label>
              <input
                type="password"
                name="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-3 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Função</label>
              <select
                name="perfil"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as 'ADMINISTRADOR' | 'ATENDENTE')}
                className="w-full px-4 py-3 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                disabled={isSubmitting}
                required
              >
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="ATENDENTE">Atendente</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="sr-only peer"
                  disabled={isSubmitting}
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ms-3 text-sm font-medium text-gray-700">Ativo</span>
              </label>
            </div>
            {/* --- Botões --- */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outlined" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" color="accent" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size={18} />
                    <span className="ml-2">Salvando...</span>
                  </div>
                ) : user ? (
                  'Salvar Alterações'
                ) : (
                  'Adicionar Usuário'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
