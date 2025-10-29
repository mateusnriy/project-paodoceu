// backend/src/validations/produtoValidation.ts
import { z } from 'zod';

// Schema para Validação de Query (Listar Paginado)
export const listarProdutosSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().positive().optional(),
    limite: z.coerce.number().int().positive().optional(),
    nome: z.string().optional(),
  }),
});
// (CORREÇÃO ERRO 6) Exportar o tipo inferido
export type ListarProdutosQuery = z.infer<
  typeof listarProdutosSchema
>['query'];

// Schema para Obter/Deletar
export const obterProdutoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do produto inválido.'),
  }),
});
export const deletarProdutoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do produto inválido.'),
  }),
});

// Schema para Criar Produto
export const criarProdutoSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'Nome é obrigatório.'),
    descricao: z.string().optional(),
    preco: z.coerce.number().positive('Preço deve ser positivo.'),
    categoria_id: z.string().uuid('ID da categoria é obrigatório.'),
    estoque: z.coerce.number().int().min(0, 'Estoque não pode ser negativo.'),
    ativo: z.boolean().optional().default(true),
  }),
});

// Schema para Atualizar Produto
export const atualizarProdutoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do produto inválido.'),
  }),
  body: z.object({
    nome: z.string().min(3, 'Nome é obrigatório.').optional(),
    descricao: z.string().optional(),
    preco: z.coerce.number().positive('Preço deve ser positivo.').optional(),
    categoria_id: z.string().uuid('ID da categoria é obrigatório.').optional(),
    estoque: z
      .coerce.number()
      .int()
      .min(0, 'Estoque não pode ser negativo.')
      .optional(),
    ativo: z.boolean().optional(),
  }),
});

// Schema para Ajuste Rápido de Estoque
export const ajustarEstoqueSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do produto inválido.'),
  }),
  body: z.object({
    quantidade: z.coerce
      .number()
      .int()
      .min(0, 'Estoque não pode ser negativo.'),
  }),
});
// (CORREÇÃO ERRO 5) Exportar o tipo inferido
export type AjustarEstoqueBody = z.infer<typeof ajustarEstoqueSchema>['body'];
