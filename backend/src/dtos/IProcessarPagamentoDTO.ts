import { MetodoPagamento } from '@prisma/client';

export interface ProcessarPagamentoDto {
  metodo: MetodoPagamento; 
  valor_pago: number; 
}
