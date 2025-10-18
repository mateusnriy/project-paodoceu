// src/utils/formatters.ts

/**
 * Formata um número para o padrão de moeda BRL (R$).
 * (Substitui o 'formatCurrency' original)
 */
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

/**
 * Formata uma data (string ISO ou Date) para um padrão legível.
 * (Função que estava faltando)
 */
export const formatarData = (
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const data = new Date(dateString);
    
    // Define opções padrão se nenhuma for fornecida
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    
    return new Intl.DateTimeFormat('pt-BR', options || defaultOptions).format(data);
  } catch (error) {
    console.warn('Data inválida para formatação:', dateString);
    return 'Data inválida';
  }
};
