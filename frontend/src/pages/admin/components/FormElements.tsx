import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

/**
 * Componentes de formulário reutilizáveis que aplicam os novos tokens
 * de design e garantem a associação correta de labels (acessibilidade).
 * CORREÇÃO: Envolvidos com React.forwardRef para aceitar refs do react-hook-form.
 */

// --- Base de Estilo para Inputs ---
const inputBaseStyle =
  'block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue ' +
  'sm:text-sm text-text-primary ' +
  'disabled:bg-status-disabled-bg disabled:text-status-disabled-text';

// --- Label ---
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  label: string;
}
export const FormLabel: React.FC<FormLabelProps> = ({ label, htmlFor, ...props }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-text-secondary mb-1"
    {...props}
  >
    {label}
  </label>
);

// --- Input (com forwardRef) ---
interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}
// <<< CORREÇÃO: Envolvido com forwardRef >>>
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, id, error, ...props }, ref) => (
    <div className="w-full">
      <FormLabel label={label} htmlFor={id} />
      <input
        id={id}
        ref={ref} // <<< Passa a ref para o input >>>
        className={`${inputBaseStyle} ${error ? 'border-status-error text-status-error' : 'border-gray-300'}`}
        aria-invalid={!!error}
        {...props}
      />
      {/* Exibe a mensagem de erro */}
      {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
    </div>
  )
);
FormInput.displayName = 'FormInput'; // <<< Adiciona displayName >>>

// --- Textarea (com forwardRef) ---
interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  error?: string;
}
// <<< CORREÇÃO: Envolvido com forwardRef >>>
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, id, error, ...props }, ref) => (
    <div className="w-full">
      <FormLabel label={label} htmlFor={id} />
      <textarea
        id={id}
        ref={ref} // <<< Passa a ref para o textarea >>>
        rows={4}
        className={`${inputBaseStyle} ${error ? 'border-status-error text-status-error' : 'border-gray-300'}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
    </div>
  )
);
FormTextarea.displayName = 'FormTextarea'; // <<< Adiciona displayName >>>

// --- Select (com forwardRef) ---
interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}
// <<< CORREÇÃO: Envolvido com forwardRef >>>
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, id, error, children, ...props }, ref) => (
    <div className="w-full">
      <FormLabel label={label} htmlFor={id} />
      <select
        id={id}
        ref={ref} // <<< Passa a ref para o select >>>
        className={`${inputBaseStyle} ${error ? 'border-status-error text-status-error' : 'border-gray-300'}`}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
    </div>
  )
);
FormSelect.displayName = 'FormSelect'; // <<< Adiciona displayName >>>
