// mateusnriy/project-paodoceu/project-paodoceu-main/backend/src/validations/produtoValidation.ts
import { z } from 'zod';

export const criarProdutoSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: 'O nome é obrigatório.' }).min(3, "Nome deve ter no mínimo 3 caracteres."),
    descricao: z.string().optional(),
    preco: z.number({ required_error: 'O preço é obrigatório.', invalid_type_error: 'Preço deve ser um número.' }).positive('O preço deve ser positivo.'),
    // <<< CORREÇÃO: Esperar 'quantidadeEstoque' (camelCase) do frontend >>>
    quantidadeEstoque: z.number({ invalid_type_error: 'Estoque deve ser um número.' }).int().nonnegative('O estoque não pode ser negativo.').optional(),
    // <<< CORREÇÃO: Esperar 'categoriaId' (camelCase) do frontend >>>
    categoriaId: z.string({ required_error: 'O ID da categoria é obrigatório.' }).uuid('ID de categoria inválido.'),
    // <<< CORREÇÃO: Esperar 'imagemUrl' (camelCase) do frontend >>>
    imagemUrl: z.string().url("URL da imagem inválida.").optional().nullable(), // Permitir null ou string vazia que vira undefined no controller
  }),
});

export const atualizarProdutoSchema = z.object({
  body: z.object({
    nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres.").optional(),
    descricao: z.string().optional(),
    preco: z.number({ invalid_type_error: 'Preço deve ser um número.' }).positive('O preço deve ser positivo.').optional(),
    // <<< CORREÇÃO: Esperar 'quantidadeEstoque' (camelCase) do frontend >>>
    quantidadeEstoque: z.number({ invalid_type_error: 'Estoque deve ser um número.' }).int().nonnegative('O estoque não pode ser negativo.').optional(),
    // <<< CORREÇÃO: Esperar 'categoriaId' (camelCase) do frontend >>>
    categoriaId: z.string().uuid('ID de categoria inválido.').optional(),
     // <<< CORREÇÃO: Esperar 'imagemUrl' (camelCase) do frontend >>>
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
