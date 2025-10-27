// src/types/api.ts

export interface PaginatedResponse<T> {
  data: T[];
  meta: { // A resposta da API inclui um objeto 'meta'
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}
