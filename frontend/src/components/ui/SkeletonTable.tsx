// src/components/ui/SkeletonTable.tsx
import React from 'react';

interface SkeletonTableProps {
  rows?: number;
  cols: number;
}

/**
 * Componente para exibir linhas de placeholder (skeleton) em uma tabela
 * enquanto os dados estão sendo carregados.
 */
export const SkeletonTable: React.FC<SkeletonTableProps> = React.memo(
  ({ rows = 5, cols }) => {
    // Cria um array de linhas de placeholder
    const tableRows = Array.from({ length: rows }, (_, rowIndex) => (
      <tr key={`skel-row-${rowIndex}`} className="animate-pulse">
        {/* Cria as colunas de placeholder para cada linha */}
        {Array.from({ length: cols }, (_, colIndex) => (
          <td
            key={`skel-col-${rowIndex}-${colIndex}`}
            className="px-6 py-4 whitespace-nowrap"
          >
            <div className="h-4 bg-gray-200 rounded-md"></div>
          </td>
        ))}
      </tr>
    ));

    return <>{tableRows}</>;
  }
);

SkeletonTable.displayName = 'SkeletonTable';
