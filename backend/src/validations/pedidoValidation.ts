import { z } from 'zod';
import { MetodoPagamento } from '@prisma/client';

const itemPedidoSchema = z.object({
  produto_id: z.string({ required_error: 'O ID do produto é obrigatório.' }).uuid(),
  quantidade: z.number({ required_error: 'A quantidade é obrigatória.' }).int().positive('A quantidade deve ser maior que zero.'),
});

export const criarPedidoSchema = z.object({
  body: z.object({
    cliente_nome: z.string().optional(),
    itens: z.array(itemPedidoSchema).nonempty('O pedido deve ter pelo menos um item.'),
  }),
});

export const processarPagamentoSchema = z.object({
  body: z.object({
    metodo: z.nativeEnum(MetodoPagamento, { errorMap: () => ({ message: 'Método de pagamento inválido.' }) }),
    valor_pago: z.number({ required_error: 'O valor pago é obrigatório.' }).positive('O valor pago deve ser positivo.'),
  }),
  params: z.object({
    id: z.string().uuid('ID de pedido inválido.'),
  }),
});
