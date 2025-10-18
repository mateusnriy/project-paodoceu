import React from 'react';

// Props para configurar o número de linhas e colunas do esqueleto
interface SkeletonTableProps {
  rows?: number; // Número de linhas a serem exibidas (padrão: 5)
  cols?: number; // Número de colunas a serem exibidas (padrão: 5)
}

/**
 * @component SkeletonTable
 * @description Componente para exibir um esqueleto de carregamento (loading state)
 * dentro de uma tabela HTML (<tbody>).
 * Renderiza linhas (<tr>) e células (<td>) com placeholders animados.
 *
 * @param rows O número de linhas do esqueleto (padrão 5).
 * @param cols O número de colunas do esqueleto (padrão 5).
 */
export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, cols = 5 }) => {
  // Renderiza um Fragment (<>) contendo as linhas (<tr>) diretamente.
  // Isso garante que ele seja um filho válido de um <tbody>.
  return (
    <>
      {/* Cria um array com o número de linhas desejado e mapeia para criar cada <tr> */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        // Cada linha recebe a animação de pulso do Tailwind
        <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
          {/* Cria um array com o número de colunas desejado e mapeia para criar cada <td> */}
          {Array.from({ length: cols }).map((_, colIndex) => (
            // Cada célula recebe o padding padrão das tabelas e não quebra linha
            <td key={`skeleton-col-${rowIndex}-${colIndex}`} className="px-6 py-4 whitespace-nowrap">
              {/* Dentro de cada célula, um div simula o conteúdo com fundo cinza e borda arredondada */}
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

