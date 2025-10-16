// src/dtos/UpdateProdutoDto.ts
// Usamos Partial para tornar todos os campos do DTO de criação opcionais
import { CreateProdutoDto } from './ICreateProdutoDTO';

export type UpdateProdutoDto = Partial<CreateProdutoDto>;
