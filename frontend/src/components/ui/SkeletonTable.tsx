import React from 'react';

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index} className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`h-4 bg-gray-200 rounded ${colIndex === 0 ? 'w-3/4' : 'w-1/2'}`}
                  ></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
