import React from 'react';
import { AlertCircle } from 'lucide-react'; // Ícone correto

interface ErrorMessageProps {
  message: string | null | undefined; // CORREÇÃO (TS2322): Adicionado 'undefined'
  title?: string; // Título opcional
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, title }) => {
  if (!message) return null;

  return (
    // Usar cores de status do tailwind.config.js e melhorar layout
    <div
      className="bg-status-error-bg text-status-error-text p-4 rounded-lg flex items-start gap-3 border border-status-error"
      role="alert" // Melhor acessibilidade
    >
      <AlertCircle size={20} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        {title && <h3 className="font-semibold mb-1 text-sm">{title}</h3>} {/* Título opcional */}
        <span className="text-sm">{message}</span> {/* Mensagem com tamanho de fonte base */}
      </div>
    </div>
  );
};
