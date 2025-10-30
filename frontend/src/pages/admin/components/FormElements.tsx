// frontend/src/pages/admin/components/FormElements.tsx
import React, {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from 'react';
import { Button } from '@/components/common/Button'; // (Necessário para FormActions)
import { Loader2 } from 'lucide-react'; // (Necessário para FormActions)

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
export const FormLabel: React.FC<FormLabelProps> = ({
  label,
  htmlFor,
  ...props
}) => (
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
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, id, error, ...props }, ref) => (
    <div className="w-full">
      <FormLabel label={label} htmlFor={id} />
      <input
        id={id}
        ref={ref} // Passa a ref
        className={`${inputBaseStyle} ${
          error ? 'border-status-error text-status-error' : 'border-gray-300'
        }`}
        aria-invalid={!!error}
        {...props} // Passa o spread de register()
      />
      {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
    </div>
  ),
);
FormInput.displayName = 'FormInput';

// --- Textarea (com forwardRef) ---
interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  error?: string;
}
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, id, error, ...props }, ref) => (
    <div className="w-full">
      <FormLabel label={label} htmlFor={id} />
      <textarea
        id={id}
        ref={ref} // Passa a ref
        rows={4}
        className={`${inputBaseStyle} ${
          error ? 'border-status-error text-status-error' : 'border-gray-300'
        }`}
        aria-invalid={!!error}
        {...props} // Passa o spread de register()
      />
      {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
    </div>
  ),
);
FormTextarea.displayName = 'FormTextarea';

// --- Select (com forwardRef) ---
interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, id, error, children, ...props }, ref) => (
    <div className="w-full">
      <FormLabel label={label} htmlFor={id} />
      <select
        id={id}
        ref={ref} // Passa a ref
        className={`${inputBaseStyle} ${
          error ? 'border-status-error text-status-error' : 'border-gray-300'
        }`}
        aria-invalid={!!error}
        {...props} // Passa o spread de register()
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
    </div>
  ),
);
FormSelect.displayName = 'FormSelect';

// --- CORREÇÃO (Causa 7): Checkbox (Faltando) ---
interface FormCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}
export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, id, error, ...props }, ref) => (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          ref={ref}
          className="h-4 w-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
          {...props}
        />
        <FormLabel label={label} htmlFor={id} className="mb-0" />
      </div>
      {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
    </div>
  ),
);
FormCheckbox.displayName = 'FormCheckbox';

// --- CORREÇÃO (Causa 7): Ações do Modal (Faltando) ---
interface FormActionsProps {
  onClose: () => void;
  isSubmitting: boolean;
  submitText?: string;
}
export const FormActions: React.FC<FormActionsProps> = ({
  onClose,
  isSubmitting,
  submitText = 'Salvar',
}) => (
  <div className="mt-8 flex justify-end gap-3 border-t pt-6">
    <Button
      type="button"
      variant="secondary"
      onClick={onClose}
      disabled={isSubmitting}
    >
      Cancelar
    </Button>
    <Button type="submit" variant="primary" disabled={isSubmitting}>
      {isSubmitting ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        submitText
      )}
    </Button>
  </div>
);
