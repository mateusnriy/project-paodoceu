import { MetodoPagamento } from '@prisma/client';

export type ProcessarPagamentoDto = {
  metodo: MetodoPagamento;
  valor_pago: number; // Para pagamentos em dinheiro, deve ser >= valor_total
};
