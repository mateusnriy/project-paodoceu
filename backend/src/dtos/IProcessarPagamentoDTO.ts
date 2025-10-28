import { MetodoPagamento } from '@prisma/client'; // <<< CORREÇÃO (Era TipoPagamento)

export interface ProcessarPagamentoDto {
  // Correção: Definir o campo esperado pela validação e serviço
  metodo: MetodoPagamento; // <<< CORREÇÃO
  valor_pago: number; // <<< CORREÇÃO
}
