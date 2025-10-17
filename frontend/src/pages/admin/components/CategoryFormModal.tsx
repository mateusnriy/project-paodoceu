import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { Category } from '../../../types'; // Barrel file
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Correção: Espera Promise<boolean> agora
  onSubmit: (nome: string) => Promise<boolean>;
  category: Category | null;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ isOpen, onClose, onSubmit, category }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(category?.nome || '');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const success = await onSubmit(name); // onSubmit agora retorna boolean
      if (success) {
        onClose(); // Fecha apenas se for sucesso
      }
    } catch (err: any) {
      // Se onSubmit lançar erro (apesar de agora retornar boolean), capturamos aqui
      setError(err.message || 'Erro ao salvar.');
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
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorMessage message={error} />
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Categoria
              </label>
              <input
                id="categoryName"
                type="text"
                className="w-full px-4 py-3 rounded-4xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
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
                ) : (category ? 'Salvar Alterações' : 'Adicionar Categoria')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
