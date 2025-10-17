import React from 'react';
import { AlertCircleIcon } from 'lucide-react';

export const ErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="bg-error/10 text-error p-3 rounded-4xl flex items-center gap-2">
      <AlertCircleIcon size={18} />
      <span>{message}</span>
    </div>
  );
};
