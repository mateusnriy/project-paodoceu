import React from 'react';
import { Button } from '../common/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Ícones opcionais

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

const Pagination: React.FC<PaginationProps> = React.memo(
  ({ paginaAtual, totalPaginas, onPageChange, isLoading }) => {
    if (totalPaginas <= 1) return null;

    const handlePrevious = () => {
      if (paginaAtual > 1) {
        onPageChange(paginaAtual - 1);
      }
    };

    const handleNext = () => {
      if (paginaAtual < totalPaginas) {
        onPageChange(paginaAtual + 1);
      }
    };

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button
          variant="secondary" // Usar secondary para paginação
          size="sm"
          onClick={handlePrevious}
          disabled={paginaAtual === 1 || isLoading}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} className="mr-1" /> {/* Ícone adicionado */}
          Anterior
        </Button>
        <span className="text-sm text-text-secondary font-medium">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <Button
          variant="secondary" // Usar secondary para paginação
          size="sm"
          onClick={handleNext}
          disabled={paginaAtual === totalPaginas || isLoading}
          aria-label="Próxima página"
        >
          Próxima
          <ChevronRight size={16} className="ml-1" /> {/* Ícone adicionado */}
        </Button>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';
export { Pagination };
