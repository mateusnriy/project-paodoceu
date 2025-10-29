import { z } from 'zod';
import { MetodoPagamento } from '@prisma/client';

const itemPedidoSchema = z.object({
  produto_id: z.string().uuid('ID do produto inválido.'),
  quantidade: z.number().int().positive('Quantidade deve ser positiva.'),
});

export const criarPedidoSchema = z.object({
  cliente_nome: z.string().optional(),
  itens: z
    .array(itemPedidoSchema)
    .min(1, 'O pedido deve conter pelo menos um item.'),
});

export const processarPagamentoSchema = z.object({
  metodo: z.nativeEnum(MetodoPagamento, {
    errorMap: () => ({ message: 'Método de pagamento inválido.' }),
  }),
  valor_pago: z
    .number()
    .positive('Valor pago deve ser positivo.')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Valor pago deve ter no máximo 2 casas decimais.',
    }),
});
