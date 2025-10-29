// backend/src/validations/pedidoValidation.ts
import { z } from 'zod';
import { MetodoPagamento } from '@prisma/client';

const itemPedidoSchema = z.object({
  produto_id: z.string().uuid('ID do produto inválido.'),
  quantidade: z.number().int().positive('Quantidade deve ser positiva.'),
});

// (CORREÇÃO ERRO 13) Exportar o tipo inferido
export type ItemPedidoDto = z.infer<typeof itemPedidoSchema>;

export const criarPedidoSchema = z.object({
  body: z.object({
    cliente_nome: z.string().optional(),
    itens: z
      .array(itemPedidoSchema)
      .min(1, 'O pedido deve conter pelo menos um item.'),
  }),
});

// (CORREÇÃO ERRO 2, 12) Exportar o tipo inferido
export type CriarPedidoBody = z.infer<typeof criarPedidoSchema>['body'];

export const processarPagamentoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do pedido inválido.'),
  }),
  body: z.object({
    metodo: z.nativeEnum(MetodoPagamento, {
      errorMap: () => ({ message: 'Método de pagamento inválido.' }),
    }),
    valor_pago: z
      .number()
      .positive('Valor pago deve ser positivo.')
      .multipleOf(0.01, {
        message: 'Valor pago deve ter no máximo 2 casas decimais.',
      }),
  }),
});

export const obterPedidoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do pedido inválido.'),
  }),
});

export const alterarStatusPedidoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do pedido inválido.'),
  }),
});

export const listarPedidosSchema = z.object({
  query: z.object({
    // Adicionar paginação se necessário no futuro
  }),
});
