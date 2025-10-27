// mateusnriy/project-paodoceu/project-paodoceu-main/backend/src/validations/produtoValidation.ts
import { z } from 'zod';

export const criarProdutoSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: 'O nome é obrigatório.' }).min(3, "Nome deve ter no mínimo 3 caracteres."),
    descricao: z.string().optional(),
    preco: z.number({ required_error: 'O preço é obrigatório.', invalid_type_error: 'Preço deve ser um número.' }).positive('O preço deve ser positivo.'),
    // <<< CORREÇÃO: Esperar 'quantidadeEstoque' (camelCase) >>>
    quantidadeEstoque: z.number({ invalid_type_error: 'Estoque deve ser um número.' }).int().nonnegative('O estoque não pode ser negativo.').default(0), // Default 0
    // <<< CORREÇÃO: Esperar 'categoriaId' (camelCase) >>>
    categoriaId: z.string({ required_error: 'A categoria é obrigatória.' }).uuid('ID de categoria inválido.'),
    // <<< CORREÇÃO: Esperar 'imagemUrl' (camelCase) >>>
    imagemUrl: z.string().url("URL da imagem inválida.").optional().nullable(),
  }),
});

export const atualizarProdutoSchema = z.object({
  body: z.object({
    nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres.").optional(),
    descricao: z.string().optional(),
    preco: z.number({ invalid_type_error: 'Preço deve ser um número.' }).positive('O preço deve ser positivo.').optional(),
    // <<< CORREÇÃO: Esperar 'quantidadeEstoque' (camelCase) >>>
    quantidadeEstoque: z.number({ invalid_type_error: 'Estoque deve ser um número.' }).int().nonnegative('O estoque não pode ser negativo.').optional(),
    // <<< CORREÇÃO: Esperar 'categoriaId' (camelCase) >>>
    categoriaId: z.string().uuid('ID de categoria inválido.').optional(),
     // <<< CORREÇÃO: Esperar 'imagemUrl' (camelCase) >>>
    imagemUrl: z.string().url("URL da imagem inválida.").optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid('ID de produto inválido.'),
  }),
});

export const ajustarEstoqueSchema = z.object({
  body: z.object({
    quantidade: z.number({ required_error: 'A quantidade é obrigatória.', invalid_type_error: 'Quantidade deve ser um número.' }).int().nonnegative('A quantidade não pode ser negativa.'),
  }),
  params: z.object({
    id: z.string().uuid('ID de produto inválido.'),
  }),
});
