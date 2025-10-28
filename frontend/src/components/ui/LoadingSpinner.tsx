import React from 'react';

// Aceita className para permitir customização adicional (ex: margens)
export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <div
    style={{ width: size, height: size }}
    // Usar a cor primária definida no tailwind.config.js e aplicar className recebido
    className={`border-t-2 border-b-2 border-primary-blue rounded-full animate-spin ${className}`}
  ></div>
);
