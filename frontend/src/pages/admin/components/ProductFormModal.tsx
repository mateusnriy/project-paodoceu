import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { Product, Category } from '../../../types'; // Barrel file
import { formatCurrency } from '../../../utils/formatters';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ProductFormData } from '../../../hooks/useAdminProducts'; // Importa tipo do formulário

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Correção: Espera Promise<boolean> e usa ProductFormData
  onSubmit: (formData: ProductFormData) => Promise<boolean>;
  product: Product | null;
  categories: Category[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSubmit, product, categories }) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados dos campos
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [estoque, setEstoque] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNome(product?.nome || '');
      setPreco(product ? formatCurrency(product.preco) : '');
      setCategoriaId(product?.categoria.id || '');
      setEstoque(product ? String(product.estoque) : '0');
      setImagemUrl(product?.imagem_url || '');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, product]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      setError('Preço inválido.');
      setIsSubmitting(false);
      return;
    }
    const estoqueNum = parseInt(estoque, 10);
    if (isNaN(estoqueNum) || estoqueNum < 0) {
      setError('Estoque inválido.');
      setIsSubmitting(false);
      return;
    }

    const formData: ProductFormData = {
      nome,
      preco: precoNum,
      categoria_id: categoriaId,
      estoque: estoqueNum,
      imagem_url: imagemUrl || null,
    };

    try {
      const success = await onSubmit(formData); // onSubmit agora retorna boolean
      if (success) {
        onClose(); // Fecha apenas se for sucesso
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-4xl shadow-soft w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-accent mb-4">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorMessage message={error} />
            {/* --- Campos do Formulário (Inputs, Select) --- */}
            <div>
              <label className="block text-sm mb-1">Nome do Produto</label>
              <input
                type="text" name="nome" value={nome} onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting} required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Preço (R$)</label>
                <input
                  type="text" name="preco" value={preco} onChange={(e) => setPreco(e.target.value)}
                  inputMode="decimal"
                  className="w-full px-4 py-3 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0,00"
                  disabled={isSubmitting} required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Categoria</label>
                <select
                  name="categoria_id" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-4 py-3 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  disabled={isSubmitting} required
                >
                  <option value="" disabled>Selecione...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Estoque</label>
              <input
                type="number" name="estoque" value={estoque} onChange={(e) => setEstoque(e.target.value)}
                min="0"
                className="w-full px-4 py-3 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting} required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">URL da Imagem</label>
              <input
                type="text" name="imagem_url" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
                disabled={isSubmitting}
              />
            </div>
            {/* --- Botões --- */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outlined" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" color="accent" disabled={isSubmitting}>
                {isSubmitting ? (
                    <div className="flex items-center justify-center">
                        <LoadingSpinner size={18} />
                        <span className="ml-2">Salvando...</span>
                    </div>
                ) : (product ? 'Salvar Alterações' : 'Adicionar Produto')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
