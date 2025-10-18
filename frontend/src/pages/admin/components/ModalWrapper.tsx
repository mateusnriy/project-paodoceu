import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Componente wrapper para padronizar a estrutura de todos os modais de Gestão.
 * Lida com o overlay, o contêiner do modal (com novos tokens) e o cabeçalho.
 */
export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Overlay (fundo)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Contêiner do Modal */}
      <div
        className="
          bg-primary-white rounded-xl shadow-soft w-full max-w-lg 
          flex flex-col max-h-[90vh]
        "
        onClick={(e) => e.stopPropagation()} // Impede que o clique dentro do modal feche-o
      >
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          {/* Título (H1 - 24px Bold, mas usamos 20px (xl) para modais) */}
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue rounded-full"
            aria-label="Fechar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo (Filhos) - com scroll interno */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
