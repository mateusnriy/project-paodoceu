// (CORREÇÃO ERRO 17) Renomeando e padronizando o DTO
import { MetodoPagamento } from '@prisma/client';

// Usar DTO em vez de Interface para consistência com o restante do projeto
export type ProcessarPagamentoDto = {
  metodo: MetodoPagamento;
  valor_pago: number; // Zod já valida como number
};
