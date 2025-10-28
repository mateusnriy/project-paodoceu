import { TipoPagamento } from '@prisma/client';

export interface ProcessarPagamentoDto {
  // Correção: Definir o campo esperado pela validação e serviço
  tipoPagamento: TipoPagamento;
}
