import { MetodoPagamento } from '@prisma/client';

export type ProcessarPagamentoDto = {
  metodo: MetodoPagamento;
  valor_pago: number;
};
